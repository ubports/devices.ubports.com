# devices.ubports.com

The UBports device website


## start debug server

```
cp config/config.example.json config/config.json
npm install
DEBUG=1 npm start
```

Then open localhost:2702 in your browser

## Production

The environment variable "NODE_ENV" needs to be set to "production" for production mode to work.
