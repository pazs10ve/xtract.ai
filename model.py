import torch
import torch.nn as nn
from torchvision.transforms import v2
from torchvision.models import densenet121, DenseNet121_Weights, resnet152, ResNet152_Weights

from loaders import get_dataloaders


class DenseNetEncoder(nn.Module):
    def __init__(self, embed_size):
        super(DenseNetEncoder, self).__init__()
        densenet = densenet121(weights = DenseNet121_Weights.DEFAULT)
        self.features = densenet.features
        self.pool = nn.AdaptiveAvgPool2d((1, 1))
        self.fc = nn.Linear(densenet.classifier.in_features, embed_size)
        self.relu = nn.ReLU()
        
    def forward(self, images):
        features = self.features(images)
        features = self.pool(features).view(features.size(0), -1)
        features = self.fc(features)
        return self.relu(features)
    

class ResNetEncoder(nn.Module):
    def __init__(self, embed_size):
        super(ResNetEncoder, self).__init__()
        resnet = resnet152(weights = ResNet152_Weights.DEFAULT)
        self.features = nn.Sequential(*list(resnet.children())[:-2])
        self.pool = nn.AdaptiveAvgPool2d((1, 1))
        self.fc = nn.Linear(resnet.fc.in_features, embed_size)
        self.relu = nn.ReLU()
    
    def forward(self, images):
        features = self.features(images)
        features = self.pool(features).view(features.size(0), -1)
        features = self.fc(features)
        return self.relu(features)




class LSTMDecoder(nn.Module):
    def __init__(self, embed_size, hidden_size, vocab_size, num_layers=1):
        super(LSTMDecoder, self).__init__()
        self.embed = nn.Embedding(vocab_size, embed_size)
        self.lstm = nn.LSTM(embed_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, vocab_size)
        self.feature_projection = nn.Linear(embed_size, hidden_size)

    def init_hidden(self, features):
        """
        Initialize LSTM hidden state from encoder features.
        Args:
            features: Encoder output of shape (batch_size, embed_size)
        Returns:
            hidden: Tuple of (h0, c0) for LSTM
        """
        features = self.feature_projection(features)
        h0 = features.unsqueeze(0).repeat(self.lstm.num_layers, 1, 1)
        c0 = torch.zeros_like(h0)
        return (h0, c0)

    def forward(self, features, captions=None, hidden=None):
        """
        Forward pass for training and inference.
        Args:
            features: Single token or features during inference (batch_size, 1) or (batch_size, embed_size)
            captions: Caption tokens during training, None during inference
            hidden: LSTM hidden state during inference, None during training
        """
        if captions is not None:  # Training mode
            embeddings = self.embed(captions[:, :-1])
            inputs = torch.cat((features, embeddings), dim=1)
            lstm_out, _ = self.lstm(inputs)
            outputs = self.fc(lstm_out)
            return outputs, None
        else:  # Inference mode
            if isinstance(features, torch.Tensor) and features.dim() == 2 and features.size(1) == 1:
                # If features is a token
                embeddings = self.embed(features.squeeze(1)).unsqueeze(1)
            else:
                # If features is the image features
                embeddings = features.unsqueeze(1)
            
            lstm_out, hidden = self.lstm(embeddings, hidden)
            outputs = self.fc(lstm_out.squeeze(1))
            return outputs, hidden


class ImageCaptioningModel(nn.Module):
    def __init__(self, embed_size, hidden_size, vocab_size, num_layers=1):
        super(ImageCaptioningModel, self).__init__()
        self.encoder = ResNetEncoder(embed_size)
        self.decoder = LSTMDecoder(embed_size, hidden_size, vocab_size, num_layers)
    
    def forward(self, images, captions):
        #print(images.shape, captions.shape)
        features = self.encoder(images)
        #print(features.shape)
        outputs, hidden = self.decoder(features.unsqueeze(1), captions)
        return outputs, hidden



"""
batch_size = 6
features = torch.randn(batch_size, 1, 1024) 
images = torch.randn(batch_size, 3, 256, 256) 
captions = torch.randint(0, 30521, (batch_size, 256)) 


encoder = ResNetEncoder(embed_size=256)
print("encoder output shape = ", encoder(images).shape)


decoder = LSTMDecoder(
    vocab_size=30522, 
    embed_size=1024,
    hidden_size=512, 
    num_layers=12
)

outputs, hidden = decoder(features, captions)
print("outputs shape = ", outputs.shape)
print("hidden shape = ", hidden[0].shape, hidden[1].shape)


model = ImageCaptioningModel(
    vocab_size=30522, 
    embed_size=1024,
    hidden_size=512, 
    num_layers=12
)

outputs, hidden = model(images, captions)
print("outputs shape = ", outputs.shape)
print("hidden shape = ", hidden[0].shape, hidden[1].shape)
#print(decoder(features, captions).shape)


transform = v2.Compose([
        v2.Resize((256, 256)),
        v2.ToImage(),
        v2.ToDtype(torch.float32, scale=True),
        v2.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])


train, _, _ = get_dataloaders('data', batch_size=6, transform=transform, max_length=256)
print(len(train))

images, captions = next(iter(train))
print(images.shape, captions.shape)

outputs, hidden = model(images, captions)
print("outputs shape = ", outputs.shape)
print("hidden shape = ", hidden[0].shape, hidden[1].shape)

"""



