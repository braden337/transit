# Transit

## Getting Started

`degit` this repository and install dependencies.

```shell
npx degit braden337/transit
npm ci
```

## API key

1. Register for a Winnipeg Transit API key
   [here](https://api.winnipegtransit.com)
2. Rename `.env.example` to `.env`
3. Inside `.env` replace `YOUR_API_KEY` with your actual API key

## Development

Start the development server.

```shell
npm start
```

## Deployment

Change the subdomain of the url in the `package.json` publish script and deploy
to [Surge](https://surge.sh).

```shell
npm run deploy
```
