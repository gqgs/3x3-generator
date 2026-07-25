# 3x3-generator

Anime/manga 3x3 generator.

<p align="center">
<img src="/src/assets/3x3gen.png">
</p>

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

The MAL provider reads its Lambda Function URL from `VUE_APP_MAL_API_URL`.
Set it when starting the development frontend or creating a production build:

```sh
VUE_APP_MAL_API_URL=https://example.lambda-url.us-east-1.on.aws npm run serve
VUE_APP_MAL_API_URL=https://example.lambda-url.us-east-1.on.aws npm run build
```

The Lambda and Function URL are deployed by the CDK app in `infra`:

```sh
cd infra
npm run deploy:mal
```

The deployment writes the Function URL to `infra/cdk-outputs.json` under
`MalCrawlerStack.MalCrawlerUrl`. Pass that value as `VUE_APP_MAL_API_URL` when
building the frontend.

### Compiles and minifies for production
```
npm run build
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
