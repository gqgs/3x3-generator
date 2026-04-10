import torch
import torch.nn as nn
import torch.nn.functional as F
import os
import urllib.request
import onnx
from onnxruntime.quantization import quantize_dynamic, QuantType

# RRDBNet architecture for RealESRGAN_x4plus_anime_6B
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
        self.conv_up1 = nn.Conv2d(nf, nf, 3, 1, 1, bias=True)
        self.conv_up2 = nn.Conv2d(nf, nf, 3, 1, 1, bias=True)
        self.conv_hr = nn.Conv2d(nf, nf, 3, 1, 1, bias=True)
        self.conv_last = nn.Conv2d(nf, out_nc, 3, 1, 1, bias=True)
        self.lrelu = nn.LeakyReLU(negative_slope=0.2, inplace=True)

    def forward(self, x):
        fea = self.conv_first(x)
        trunk = self.conv_body(self.body(fea))
        fea = fea + trunk
        fea = self.lrelu(self.conv_up1(F.interpolate(fea, scale_factor=2, mode='nearest')))
        fea = self.lrelu(self.conv_up2(F.interpolate(fea, scale_factor=2, mode='nearest')))
        out = self.conv_last(self.lrelu(self.conv_hr(fea)))
        return out

def convert_6b():
    model_url = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth"
    model_path = "RealESRGAN_x4plus_anime_6B.pth"
    raw_onnx = "public/models/RealESRGAN/RealESRGAN_x4plus_anime_6B_raw.onnx"
    uint8_onnx = "public/models/RealESRGAN/RealESRGAN_x4plus_anime_6B_uint8.onnx"
    
    if not os.path.exists(model_path): urllib.request.urlretrieve(model_url, model_path)
    
    model = RRDBNet(in_nc=3, out_nc=3, nf=64, nb=6, gc=32, upscale=4)
    loadnet = torch.load(model_path, map_location='cpu')
    state_dict = loadnet['params_ema'] if 'params_ema' in loadnet else (loadnet['params'] if 'params' in loadnet else loadnet)
    model.load_state_dict(state_dict, strict=True)
    model.eval()

    dummy_input = torch.randn(1, 3, 256, 256)
    torch.onnx.export(model, dummy_input, raw_onnx, opset_version=14, input_names=['input'], output_names=['output'])
    
    print("Generating UINT8 version for Real-ESRGAN...")
    quantize_dynamic(
        model_input=raw_onnx, 
        model_output=uint8_onnx, 
        weight_type=QuantType.QUInt8, # Back to UINT8
        per_channel=False,
        reduce_range=False
    )
    if os.path.exists(raw_onnx): os.remove(raw_onnx)

if __name__ == "__main__":
    os.makedirs("public/models/RealESRGAN", exist_ok=True)
    convert_6b()
    print("Done Real-ESRGAN!")
