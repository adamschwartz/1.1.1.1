const { src, dest, parallel, watch } = require("gulp");
const minifyCSS = require("gulp-csso");
const concat = require("gulp-concat");
const uglify = require("gulp-uglify-es").default;

function css() {
  return src([
    // Globals - order could matter
    "./css/global/box-sizing.css",
    "./css/global/element-normalization.css",
    "./css/global/sizes-variables.css",
    "./css/global/brand-color-variables.css",
    "./css/global/theme-color-variables.css",
    "./css/global/selection-color.css",
    "./css/global/font-smoothing.css",
    "./css/global/html.css",
    "./css/global/surface.css",
    "./css/global/body-font-size.css",


    // Components - order doesn’t matter but we list for readability
    "./css/components/copy-link.css",
    "./css/components/button.css",
    "./css/components/label-input-wrapper.css",
    "./css/components/input.css",

    "./css/components/header.css",
    "./css/components/nav.css",
    "./css/components/section-copy.css",
    "./css/components/device-mockup.css",

    "./css/components/one-dot-logo-animated.css",
    "./css/components/cloudflare-logo.css",

    "./css/components/hero-section.css",
    "./css/components/app-overview-section.css",
    "./css/components/performance-section.css",
    "./css/components/privacy-section.css",
    "./css/components/warp-section.css",
    "./css/components/footer-section.css",
    "./css/components/easter-egg-section.css"
  ])
    .pipe(concat("index.css"))
    // .pipe(minifyCSS())
    .pipe(dest("./"));
}

function js() {
  return src([
    "./js/lib/text-balancer.js",
    "./js/lib/focus-visible-polyfill.js",
    "./js/lib/basicScroll.js",
    "./js/index.js"
  ])
    .pipe(concat("index.js"))
    // .pipe(uglify())
    .pipe(dest("./"));
}

function watchFiles() {
  watch(["./css/**/*.css", "js/**/*.js"], parallel(css, js));
}

exports.js = js;
exports.css = css;
exports.watch = watchFiles;
exports.default = parallel(css, js);
