import torch
import torch.nn as nn
from torchvision.transforms import v2
import matplotlib.pyplot as plt
from PIL import Image

from model import ImageCaptioningModel
from loaders import get_tokenizer



def load_model(model_path, device, vocab_size=30522, embed_size=768, hidden_size=1024, num_layers=5):
    model = ImageCaptioningModel(
        vocab_size=vocab_size,
        embed_size=embed_size,
        hidden_size=hidden_size,
        num_layers=num_layers
    )
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()
    return model



def preprocess_image(image_path, transform):
    image = Image.open(image_path).convert("RGB")
    return transform(image)


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


def main(image_path, model_path, tokenizer, device):
    transform = v2.Compose([
        v2.Resize((356, 356)),
        v2.ToImage(),
        v2.ToDtype(torch.float32, scale=True),
        v2.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    image = preprocess_image(image_path, transform)
    image = image.to(device)
    model = load_model(model_path, device).to(device)

    caption = generate_caption(model, image, device, tokenizer)
    print(f"Generated Caption: {caption}")

    plt.figure(figsize=(8, 8))
    plt.imshow(Image.open(image_path))
    plt.title(f"Caption: {caption}", fontsize=12)
    plt.axis('off')
    plt.show()



image_path = r'1.png'
model_path = r'model.pth'
tokenizer = get_tokenizer()
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
main(image_path, model_path, tokenizer, device)