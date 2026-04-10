import torch
import onnx
import os
import urllib.request
from onnxruntime.quantization import quantize_dynamic, QuantType
from onnxsim import simplify
from onnxconverter_common import convert_float_to_float16

def convert_swin2sr():
    model_url = "https://huggingface.co/Xenova/swin2SR-lightweight-x2-64/resolve/main/onnx/model.onnx"
    raw_onnx = "public/models/Swin2SR/model.onnx"
    opt_onnx = "public/models/Swin2SR/swin2SR_opt.onnx"
    fp16_onnx = "public/models/Swin2SR/swin2SR_fp16.onnx"
    uint8_onnx = "public/models/Swin2SR/swin2SR_uint8.onnx"
    
    os.makedirs("public/models/Swin2SR", exist_ok=True)
    
    if not os.path.exists(raw_onnx):
        print(f"Downloading {model_url}...")
        urllib.request.urlretrieve(model_url, raw_onnx)
    
    # 1. FP16 Version (For WebGPU) - Keep simplification as it works there
    print("Generating Optimized FP16 version...")
    onnx_model = onnx.load(raw_onnx)
    model_simp, check = simplify(onnx_model)
    onnx.save(model_simp, opt_onnx)
    model_fp16 = convert_float_to_float16(onnx.load(opt_onnx))
    onnx.save(model_fp16, fp16_onnx)

    # 2. UINT8 Version (For WASM) - Use RAW model to avoid ShapeInferenceError
    # Many WASM errors come from 'simplified' graphs losing dimension metadata
    print("Generating Conservative UINT8 version for WASM...")
    quantize_dynamic(
        model_input=raw_onnx, 
        model_output=uint8_onnx, 
        weight_type=QuantType.QUInt8, # Back to UINT8 which is more stable in ORT-web
        per_channel=False,
        reduce_range=False
    )
    
    if os.path.exists(opt_onnx): os.remove(opt_onnx)
    print("Done Swin2SR!")

if __name__ == "__main__":
    convert_swin2sr()
