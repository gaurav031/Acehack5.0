import streamlit as st
from streamlit_webrtc import webrtc_streamer, WebRtcMode, RTCConfiguration
from ultralytics import YOLO
import av
import cv2

# 1. Load your trained .pt model
model = YOLO("best.pt")

# 2. Define the Price Database (matches your YOLO names)
price_db = {
    "banarasi_saree": "₹3,000 – 4,000",
    "deity": "₹300 – 500",
    "leather_shoe": "₹400 – 600",
    "pashmini_shawl": "₹1,000 – 1,200"
}

# 3. Define the Frame Processor
def video_frame_callback(frame):
    img = frame.to_ndarray(format="bgr24")

    # Run YOLO detection
    results = model(img, conf=0.4)
    
    # Draw custom boxes and prices
    for r in results:
        for box in r.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            label = model.names[int(box.cls[0])]
            price = price_db.get(label, "Check Local")
            
            # Draw on the frame
            cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(img, f"{label}: {price}", (x1, y1 - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

    return av.VideoFrame.from_ndarray(img, format="bgr24")

# 4. Streamlit UI
st.title("🇮🇳 India Tourist Price AI")
st.write("Point your camera at a product to see the fair street price.")

webrtc_streamer(
    key="tourist-detector",
    mode=WebRtcMode.SENDRECV,
    rtc_configuration={"iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}]}, # Crucial for cloud
    video_frame_callback=video_frame_callback,
    media_stream_constraints={"video": {"facingMode": "environment"}, "audio": False}, # Force back camera
    async_processing=True,
)