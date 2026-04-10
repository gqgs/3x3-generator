import torch
import onnx
import os
import urllib.request
from onnxruntime.quantization import quantize_dynamic, QuantType

def convert_swin2sr():
    model_url = "https://huggingface.co/Xenova/swin2SR-lightweight-x2-64/resolve/main/onnx/model.onnx"
    raw_onnx = "public/models/Swin2SR/model.onnx"
    uint8_onnx = "public/models/Swin2SR/swin2SR_uint8.onnx"
    
    os.makedirs("public/models/Swin2SR", exist_ok=True)
    
    if not os.path.exists(raw_onnx):
        print(f"Downloading {model_url}...")
        urllib.request.urlretrieve(model_url, raw_onnx)
    
    print("Generating UINT8 version for Swin2SR...")
    quantize_dynamic(
        model_input=raw_onnx, 
        model_output=uint8_onnx, 
        weight_type=QuantType.QUInt8, # Back to UINT8
        per_channel=False,
        reduce_range=False
    )
    
    print("Done Swin2SR!")

if __name__ == "__main__":
    convert_swin2sr()
