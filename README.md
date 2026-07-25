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

The MyAnimeList search provider expects `mal-crawler` at
`http://127.0.0.1:8081` by default. Start it from the `mal-crawler` repository:

```sh
go run . --server 127.0.0.1:8081
```

Set `VUE_APP_MAL_API_URL` when the API is hosted elsewhere:

```sh
VUE_APP_MAL_API_URL=https://example.lambda-url.amazonaws.com npm run build
```

### Compiles and minifies for production
```
npm run build
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
