from ultralytics import YOLO

model = YOLO("best.pt")
import json
print(json.dumps(model.names, indent=4))
