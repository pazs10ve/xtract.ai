import os
import torch
import torch.nn as nn
from torchvision.transforms import v2
from PIL import Image
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from flask_cors import CORS  # Import CORS

from model import ImageCaptioningModel
from loaders import get_tokenizer

from together import Together



# Global variables
MODEL_PATH = 'model.pth'
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
MODEL = None
TOKENIZER = None

# Create the Flask application
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure app
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg'}

# Create upload folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def load_model(model_path, device, vocab_size=30522, embed_size=768, hidden_size=1024, num_layers=5):
    model = ImageCaptioningModel(
        vocab_size=vocab_size,
        embed_size=embed_size,
        hidden_size=hidden_size,
        num_layers=num_layers
    )
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.to(device)
    model.eval()
    return model

def preprocess_image(image_path, transform):
    image = Image.open(image_path).convert("RGB")
    return transform(image)

def get_image_transform():
    return v2.Compose([
        v2.Resize((356, 356)),
        v2.ToImage(),
        v2.ToDtype(torch.float32, scale=True),
        v2.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

def generate_caption(model, image, device, tokenizer, max_length=256):
    model.eval()
    
    with torch.no_grad():
        image = image.unsqueeze(0)
        features = model.encoder(image)
        
        hidden = model.decoder.init_hidden(features)
        
        current_token = torch.tensor([[tokenizer.cls_token_id]], device=device)
        caption = [tokenizer.cls_token_id]
        
        for _ in range(max_length):
            outputs, hidden = model.decoder(current_token, hidden=hidden)
            
            predicted = outputs.argmax(1)
            predicted_token = predicted.item()
            caption.append(predicted_token)
            
            if predicted_token == tokenizer.sep_token_id:
                break
                
            current_token = predicted.unsqueeze(0)
        
        return tokenizer.decode(caption, skip_special_tokens=True)

# Initialize model and tokenizer
@app.before_request
def initialize_if_needed():
    global MODEL, TOKENIZER
    if MODEL is None or TOKENIZER is None:
        TOKENIZER = get_tokenizer()
        MODEL = load_model(MODEL_PATH, DEVICE)
        print(f"Model loaded and running on {DEVICE}")

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'model': 'loaded' if MODEL is not None else 'not loaded',
        'device': str(DEVICE)
    })

"""
@app.route('/api/caption', methods=['POST'])
def generate_image_caption():
    # Check if the post request has the file part
    if 'image' not in request.files:
        return jsonify({'error': 'No image file in the request'}), 400
    
    file = request.files['image']
    
    # If user does not select file, browser also
    # submit an empty part without filename
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        # Save the file temporarily
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # Process the image
            transform = get_image_transform()
            image = preprocess_image(filepath, transform)
            image = image.to(DEVICE)
            
            # Generate caption
            caption = generate_caption(MODEL, image, DEVICE, TOKENIZER)
            
            # Return result
            return jsonify({
                'success': True,
                'caption': caption,
                'filename': filename
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
      
    
    return jsonify({'error': 'Invalid file format'}), 400

"""

"""
@app.route('/api/caption', methods=['POST'])
def generate_image_caption():
    # Check if the post request has the file part
    if 'image' not in request.files:
        return jsonify({'error': 'No image file in the request'}), 400
    
    file = request.files['image']
    
    # If user does not select file, browser also
    # submit an empty part without filename
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        # Save the file temporarily
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # Process the image
            transform = get_image_transform()
            image = preprocess_image(filepath, transform)
            image = image.to(DEVICE)
            
            # Generate caption
            caption = generate_caption(MODEL, image, DEVICE, TOKENIZER)
            
            # Use Together AI to generate a comprehensive report from the caption
            try:
                api_key = os.environ.get('TOGETHER_API_KEY')
                if not api_key:
                    raise ValueError("TOGETHER_API_KEY not found in environment variables")
                
                client = Together(api_key=api_key)
                
                # Create a prompt that instructs Llama to generate a report based on the caption
                prompt = f"Using the following image caption, create a comprehensive report:\n\nCaption: {caption}\n\nPlease generate a detailed, professional report based on this information."
                
                # For X-ray specific formatting, you could modify the prompt:
                if "x-ray" in caption.lower() or "xray" in caption.lower():
                    prompt = f"Using the following X-ray image caption, create a comprehensive radiological report:\n\nX-ray Caption: {caption}\n\nPlease include sections for findings, impressions, and recommendations if applicable."
                
                response = client.chat.completions.create(
                    model="meta-llama/Llama-3.3-70B-Instruct-Turbo",
                    messages=[
                        {"role": "system", "content": "You are a helpful assistant that creates detailed reports based on image captions."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=1000
                )
                
                # Extract the generated report
                report = response.choices[0].message.content
                
                # Return result with both caption and report
                return jsonify({
                    'success': True,
                    'caption': caption,
                    'report': report,
                    'filename': filename
                })
                
            except Exception as e:
                # If Together API fails, still return the caption
                print(f"Error generating report with Together AI: {str(e)}")
                return jsonify({
                    'success': True,
                    'caption': caption,
                    'error_report': str(e),
                    'filename': filename
                })
                
        except Exception as e:
            # Clean up the file in case of error
            if os.path.exists(filepath):
                os.remove(filepath)
                
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
        finally:
            # Clean up temporary file
            if os.path.exists(filepath):
                os.remove(filepath)
    
    return jsonify({'error': 'Invalid file format'}), 400
"""

@app.route('/api/caption', methods=['POST'])
def generate_image_caption():
    # Check if the post request has the file part
    if 'image' not in request.files:
        return jsonify({'error': 'No image file in the request'}), 400
    
    file = request.files['image']
    
    # If user does not select file, browser also
    # submit an empty part without filename
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        # Save the file temporarily
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # Process the image
            transform = get_image_transform()
            image = preprocess_image(filepath, transform)
            image = image.to(DEVICE)
            
            # Generate caption
            caption = generate_caption(MODEL, image, DEVICE, TOKENIZER)
            print(caption)
            
            # Use Together AI to generate a comprehensive report from the caption
            try:
                api_key = os.environ.get('TOGETHER_API_KEY')
                if not api_key:
                    raise ValueError("TOGETHER_API_KEY not found in environment variables")
                
                client = Together(api_key=api_key)
                
                # Create a prompt that instructs Llama to generate a report based on the caption
                prompt = f"Using the following image caption, create a comprehensive report:\n\nCaption: {caption}\n\nPlease generate a detailed, professional report based on this information."
                
                # For X-ray specific formatting, you could modify the prompt:
                if "x-ray" in caption.lower() or "xray" in caption.lower():
                    prompt = f"Using the following X-ray image caption, create a comprehensive radiological report:\n\nX-ray Caption: {caption}\n\nPlease include sections for findings, impressions, and recommendations if applicable."
                
                response = client.chat.completions.create(
                    model="meta-llama/Llama-3.3-70B-Instruct-Turbo",
                    messages=[
                        {"role": "system", "content": "You are a helpful assistant that creates detailed reports based on image captions."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=1000
                )

                
                
                # Extract the generated report
                report = response.choices[0].message.content
                print(report)
                
                # Return result with both caption and report
                return jsonify({
                    'success': True,
                    'caption': report,
                    'report': report,
                    'filename': filename
                })
                
            except Exception as e:
                # If Together API fails, still return the caption
                print(f"Error generating report with Together AI: {str(e)}")
                return jsonify({
                    'success': True,
                    'caption': caption,
                    'error_report': str(e),
                    'filename': filename
                })
                
        except Exception as e:
            # Clean up the file in case of error
            if os.path.exists(filepath):
                os.remove(filepath)
                
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
        finally:
            # Clean up temporary file
            if os.path.exists(filepath):
                os.remove(filepath)
    
    return jsonify({'error': 'Invalid file format'}), 400


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)