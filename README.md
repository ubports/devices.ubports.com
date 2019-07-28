# devices.ubports.com

The old [UBports devices page](https://devices.ubports.com), no longer in use. Check out [devices.ubuntu-touch.io](https://devices.ubuntu-touch.io) for the new one.


## How to start a debug server

You might have to install npm, pug and sqlite3.

```
cp config/config.example.json config/config.json
npm install
DEBUG=1 npm start
```

Then open [localhost:2702](http://localhost:2702) in your browser.

## Production

The environment variable "NODE_ENV" needs to be set to "production" for production mode to work.
