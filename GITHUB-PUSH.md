# Push design portfolio to ezheng05/portfolio

Your folder is now organized to match what `index.html` expects. Since you already pushed `index.html` from somewhere else, use one of these:

## Option A: You have the repo cloned somewhere

1. Copy **everything** from `Documents/design portfolio` into your clone (overwrite `index.html` and add all folders/files).
2. In the clone:
   ```bash
   git add .
   git status   # check: index.html, about-photo.png, demo.mp4, *.png, enlaye/, popple-images/, portfolio-media/, streamlit/, .gitignore
   git commit -m "Add all portfolio media and assets"
   git push origin main
   ```

## Option B: Clone fresh and copy in

```bash
cd ~/Documents
git clone https://github.com/ezheng05/portfolio.git portfolio-repo
cd portfolio-repo
# Copy everything from design portfolio into this folder (replace index.html, add all assets)
cp -R "../design portfolio/"* .
cp "../design portfolio/.gitignore" .
git add .
git status
git commit -m "Add all portfolio media and assets"
git push origin main
```

## What must be in the repo (checklist)

| Path | Purpose |
|------|--------|
| `index.html` | Main page |
| `about-photo.png` | About section photo |
| `enlaye-logo.png` | Enlaye card + project logo |
| `popple-logo.png` | Popple card + project logo |
| `streamlit-logo.png` | Streamlit card + project logo |
| `reco-logo.png` | ReCo card + project logo |
| `demo.mp4` | ReCo project demo video |
| `portfolio-media/` | 17 files – about carousel (atv.jpg, beli.png, … drumming.mov, … tennis.JPG) |
| `enlaye/` | 6 files – password section (enlaye home.png, doc comparison.png, … guardian angel.mp4, project settings.mp4) |
| `popple-images/` | 12 images – Popple gallery |
| `streamlit/` | poster.png, demo.mp4, CAD1.png–CAD4.png |
| `.gitignore` | Ignores .DS_Store |

**Nothing is missing** if the above are present. The `reco/` folder in design portfolio is now redundant (demo.mp4 and reco-logo.png are at root); you can leave it or delete it before copying.
