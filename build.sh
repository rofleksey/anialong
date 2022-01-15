set -e
cd frontend
npm run build
cd ..
sudo docker build -t rofleksey/anialong:latest .
sudo docker push rofleksey/anialong:latest