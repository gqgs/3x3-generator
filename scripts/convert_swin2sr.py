import torch
import onnx
import os
import urllib.request
from onnxruntime.quantization import quantize_dynamic, QuantType

def convert_swin2sr():
    raw_onnx = "scripts/models/swin2SR.onnx"
    uint8_onnx = "public/models/Swin2SR/swin2SR_uint8.onnx"
    
    os.makedirs("public/models/Swin2SR", exist_ok=True)
    
    print("Generating UINT8 version for Swin2SR...")
    quantize_dynamic(
        model_input=raw_onnx, 
        model_output=uint8_onnx, 
        weight_type=QuantType.QUInt8, # Back to UINT8
        per_channel=False,
        reduce_range=False
    )

    print("Converting to ORT format...")
    from pathlib import Path
    import onnxruntime.tools.convert_onnx_models_to_ort as ort_convert
    ort_convert.convert_onnx_models_to_ort(
        Path(uint8_onnx),
        output_dir=Path(os.path.dirname(uint8_onnx)),
        optimization_styles=[ort_convert.OptimizationStyle.Fixed]
    )
    
    print("Done Swin2SR!")

if __name__ == "__main__":
    convert_swin2sr()
