import torch
import torch.nn as nn
import torch.nn.functional as F
import os
import urllib.request
import onnx
from onnxruntime.quantization import quantize_dynamic, QuantType

# Simplified RRDBNet architecture for RealESRGAN_x4plus_anime_6B
# Adapted to match the naming convention in the official .pth file

def make_layer(block, n_layers):
    layers = []
    for _ in range(n_layers):
        layers.append(block())
    return nn.Sequential(*layers)

class ResidualDenseBlock_5C(nn.Module):
    def __init__(self, nf=64, gc=32, bias=True):
        super(ResidualDenseBlock_5C, self).__init__()
        self.conv1 = nn.Conv2d(nf, gc, 3, 1, 1, bias=bias)
        self.conv2 = nn.Conv2d(nf + gc, gc, 3, 1, 1, bias=bias)
        self.conv3 = nn.Conv2d(nf + 2 * gc, gc, 3, 1, 1, bias=bias)
        self.conv4 = nn.Conv2d(nf + 3 * gc, gc, 3, 1, 1, bias=bias)
        self.conv5 = nn.Conv2d(nf + 4 * gc, nf, 3, 1, 1, bias=bias)
        self.lrelu = nn.LeakyReLU(negative_slope=0.2, inplace=True)

    def forward(self, x):
        x1 = self.lrelu(self.conv1(x))
        x2 = self.lrelu(self.conv2(torch.cat((x, x1), 1)))
        x3 = self.lrelu(self.conv3(torch.cat((x, x1, x2), 1)))
        x4 = self.lrelu(self.conv4(torch.cat((x, x1, x2, x3), 1)))
        x5 = self.conv5(torch.cat((x, x1, x2, x3, x4), 1))
        return x5 * 0.2 + x

class RRDB(nn.Module):
    def __init__(self, nf, gc=32):
        super(RRDB, self).__init__()
        self.rdb1 = ResidualDenseBlock_5C(nf, gc)
        self.rdb2 = ResidualDenseBlock_5C(nf, gc)
        self.rdb3 = ResidualDenseBlock_5C(nf, gc)

    def forward(self, x):
        out = self.rdb1(x)
        out = self.rdb2(out)
        out = self.rdb3(out)
        return out * 0.2 + x

class RRDBNet(nn.Module):
    def __init__(self, in_nc=3, out_nc=3, nf=64, nb=6, gc=32, upscale=4):
        super(RRDBNet, self).__init__()
        self.upscale = upscale
        self.conv_first = nn.Conv2d(in_nc, nf, 3, 1, 1, bias=True)
        self.body = make_layer(lambda: RRDB(nf, gc), nb)
        self.conv_body = nn.Conv2d(nf, nf, 3, 1, 1, bias=True)
        # upsampling
        self.conv_up1 = nn.Conv2d(nf, nf, 3, 1, 1, bias=True)
        self.conv_up2 = nn.Conv2d(nf, nf, 3, 1, 1, bias=True)
        self.conv_hr = nn.Conv2d(nf, nf, 3, 1, 1, bias=True)
        self.conv_last = nn.Conv2d(nf, out_nc, 3, 1, 1, bias=True)
        self.lrelu = nn.LeakyReLU(negative_slope=0.2, inplace=True)

    def forward(self, x):
        fea = self.conv_first(x)
        trunk = self.conv_body(self.body(fea))
        fea = fea + trunk

        if self.upscale == 4:
            fea = self.lrelu(self.conv_up1(F.interpolate(fea, scale_factor=2, mode='nearest')))
            fea = self.lrelu(self.conv_up2(F.interpolate(fea, scale_factor=2, mode='nearest')))
        elif self.upscale == 2:
            fea = self.lrelu(self.conv_up1(F.interpolate(fea, scale_factor=2, mode='nearest')))
        
        out = self.conv_last(self.lrelu(self.conv_hr(fea)))
        return out

def convert():
    model_url = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth"
    model_path = "RealESRGAN_x4plus_anime_6B.pth"
    onnx_path = "public/models/RealESRGAN/RealESRGAN_x4plus_anime_6B.onnx"
    onnx_quant_path = "public/models/RealESRGAN/RealESRGAN_x4plus_anime_6B_uint8.onnx"
    
    os.makedirs("public/models/RealESRGAN", exist_ok=True)
    
    if not os.path.exists(model_path):
        print(f"Downloading {model_url}...")
        urllib.request.urlretrieve(model_url, model_path)
    
    print("Loading model...")
    model = RRDBNet(in_nc=3, out_nc=3, nf=64, nb=6, gc=32, upscale=4)
    
    loadnet = torch.load(model_path, map_location='cpu')
    if 'params_ema' in loadnet:
        keyname = 'params_ema'
    elif 'params' in loadnet:
        keyname = 'params'
    else:
        keyname = None
    
    if keyname:
        model.load_state_dict(loadnet[keyname], strict=True)
    else:
        model.load_state_dict(loadnet, strict=True)
        
    model.eval()
    
    print("Exporting to ONNX (FIXED SHAPE: 128x128)...")
    # Fixed shape 128x128 -> 512x512
    dummy_input = torch.randn(1, 3, 128, 128)
    
    # Export without dynamic axes to optimize for fixed shape
    torch.onnx.export(
        model, 
        dummy_input, 
        onnx_path, 
        opset_version=18,
        input_names=['input'], 
        output_names=['output']
    )
    
    # Merge external data back into the ONNX file
    print("Merging external data...")
    onnx_model = onnx.load(onnx_path)
    onnx.save_model(onnx_model, onnx_path, save_as_external_data=False)
    
    # Cleanup .data file if it exists
    data_path = onnx_path + ".data"
    if os.path.exists(data_path):
        os.remove(data_path)
    
    print(f"Quantizing to INT8...")
    quantize_dynamic(
        model_input=onnx_path,
        model_output=onnx_quant_path,
        weight_type=QuantType.QUInt8
    )
    
    print(f"Self-contained quantized ONNX model saved to {onnx_quant_path}")

if __name__ == "__main__":
    convert()
