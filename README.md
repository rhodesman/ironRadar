# ironradar
ironradar frontend/backend repository hosting

## Installation

Verify *.sh files have proper permissions
```bash
chmod 775 *.sh
```

From root directory run:
```bash
./install.sh
```

Create .env file in the backend-server folder for APi access
```bash
cd backend-server
touch .env
vi .env
```

.env file should look like this:
```sh
API_URL=https://api.threatanalysis.io/prod/all/30d/json
API_KEY=[add API key here]
ACCEPT_HEADER=application/json
```

return to root directory and start the application
```bash
cd ..
./launch.sh
```