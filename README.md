# squooshNode

Image CDN using wasm codecs from [squoosh](https://github.com/GoogleChromeLabs/squoosh).

## Usage

Launch server with:

`npm run start`

**Input image has to be in png format with an ETag header present!**

Output format can be either png or webp and is specified in the path:

`http://server-address/:format/http://image-adress.png`


### Common preprocessor options
* colors (default is 256)
* dither (default is 1.0)

### PNG options
Following query string params supported for webp output:
* fast (skips a pass with oxipng, defaults to false)

Example:

`http://server-address/png/http://image-adress.png?colors=100&dither=0.4&fast`

### WEBP options
Following query string params supported for webp output:

* q (quality, default is 75)
* lossless (default is false)

Example:
`http://server-address/webp/http://image-adress.png?colors=100&dither=0.4&q=30`


## Cache Policy

Cache layer checks requested url as well as that remote image ETag didn't change.

## TODO
* replace dummy cache store with Redis
* memoize node fetch calls
* add remote url domain mask whitelist env setting
* limit stored image variations for a single image
* containerize with Docker Compose
