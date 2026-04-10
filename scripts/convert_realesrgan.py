import torch
import torch.nn as nn
import torch.nn.functional as F
import os
import urllib.request
import onnx
from onnxruntime.quantization import quantize_dynamic, QuantType

# SRVGGNetCompact architecture for realesr-animevideov3
# This model uses a sequence of [Conv, Act, Conv, Act, ...]

class SRVGGNetCompact(nn.Module):
    def __init__(self, num_in_ch=3, num_out_ch=3, num_feat=64, num_conv=16, upscale=4):
        super(SRVGGNetCompact, self).__init__()
        self.num_feat = num_feat
        self.num_conv = num_conv
        self.upscale = upscale

        self.body = nn.Sequential()
        # The official v3 model has layers like body.0, body.1, ... 
        # where even indices are Conv2d and odd indices are PReLU
        self.body.add_module('0', nn.Conv2d(num_in_ch, num_feat, 3, 1, 1))
        self.body.add_module('1', nn.PReLU(num_parameters=num_feat))
        
        for i in range(num_conv - 1):
            self.body.add_module(f'{2*i+2}', nn.Conv2d(num_feat, num_feat, 3, 1, 1))
            self.body.add_module(f'{2*i+3}', nn.PReLU(num_parameters=num_feat))
            
        # The last conv layer in v3 (for x4)
        self.body.add_module(f'{2*num_conv}', nn.Conv2d(num_feat, num_out_ch * upscale * upscale, 3, 1, 1))

    def forward(self, x):
        out = self.body(x)
        out = F.pixel_shuffle(out, self.upscale)
        return out

def convert():
    model_url = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesr-animevideov3.pth"
    model_path = "realesr-animevideov3.pth"
    onnx_path = "public/models/RealESRGAN/realesr-animevideov3.onnx"
    onnx_quant_path = "public/models/RealESRGAN/realesr-animevideov3_uint8.onnx"
    
    os.makedirs("public/models/RealESRGAN", exist_ok=True)
    
    if not os.path.exists(model_path):
        print(f"Downloading {model_url}...")
        urllib.request.urlretrieve(model_url, model_path)
    
    print("Loading model...")
    # realesr-animevideov3 (x4) has 17 convs total
    model = SRVGGNetCompact(num_in_ch=3, num_out_ch=3, num_feat=64, num_conv=17, upscale=4)
    
    loadnet = torch.load(model_path, map_location='cpu')
    
    # Handle the nesting in the .pth file
    if 'params' in loadnet:
        state_dict = loadnet['params']
    elif 'params_ema' in loadnet:
        state_dict = loadnet['params_ema']
    else:
        state_dict = loadnet
    
    model.load_state_dict(state_dict, strict=True)
    model.eval()
    
    print("Exporting to ONNX (FIXED SHAPE: 128x128)...")
    dummy_input = torch.randn(1, 3, 128, 128)
    
    torch.onnx.export(
        model, 
        dummy_input, 
        onnx_path, 
        opset_version=14,
        input_names=['input'], 
        output_names=['output']
    )
    
    print(f"Quantizing to INT8...")
    quantize_dynamic(
        model_input=onnx_path,
        model_output=onnx_quant_path,
        weight_type=QuantType.QUInt8
    )
    
    print(f"Self-contained quantized ONNX model saved to {onnx_quant_path}")

if __name__ == "__main__":
    convert()
