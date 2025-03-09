import os
import json
from PIL import Image
import pandas as pd
from torchvision.transforms import v2
from torch.utils.data import Dataset, DataLoader
from transformers import AutoTokenizer


class IUXrayDataset(Dataset):
    def __init__(self,
                  data_dir : str, 
                  split : str, 
                  tokenizer : str = "microsoft/BiomedNLP-BiomedBERT-base-uncased-abstract-fulltext", 
                  max_length : int = 256,
                  transform : v2.Transform = None):
        self.data_dir = data_dir
        self.split = split
        self.annotations = self.load_annotations()
        self.tokenizer = AutoTokenizer.from_pretrained(tokenizer)
        self.max_length = max_length
        self.transform = transform

    def load_annotations(self):
        json_file_path = os.path.join(self.data_dir, 'annotation.json')
        with open(json_file_path, 'r') as f:
            data = json.load(f)

        rows = []
        for category, items in data.items():
            for item in items:
                for i in range(min(len(item["image_path"]), 2)):
                    rows.append({
                        "id": item["id"],
                        "img_path": item["image_path"][i],
                        "report": item["report"],
                        "category": category
                    })

        df = pd.DataFrame(rows)
        df = df[df['category'] == self.split]
        df = df.reset_index(drop=True)
        return df 

    def __len__(self):
        return len(self.annotations)
    
    def __getitem__(self, idx):

        row = self.annotations.loc[idx]
        img_path = os.path.join(self.data_dir, 'images', row['img_path'])
        img = Image.open(img_path).convert('RGB') 

        if self.transform:
            img = self.transform(img) 

        report_text = row['report']
        #print(report_text)
        report_tokens = self.tokenizer(
            report_text,
            max_length=self.max_length,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )

        return img, report_tokens['input_ids'].squeeze()


def get_dataloaders(data_dir : str, batch_size : int = 6, transform=None, max_length : int = 256):
    train_dataset = IUXrayDataset(data_dir, 'train', transform=transform, max_length=max_length)
    val_dataset = IUXrayDataset(data_dir, 'val', transform=transform, max_length=max_length)
    test_dataset = IUXrayDataset(data_dir, 'test', transform=transform, max_length=max_length)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)

    return train_loader, val_loader, test_loader


def get_tokenizer(tokenizer : str = "microsoft/BiomedNLP-BiomedBERT-base-uncased-abstract-fulltext"):
    return AutoTokenizer.from_pretrained(tokenizer)