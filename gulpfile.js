const {src, dest} = require("gulp"),
    gulp = require("gulp"),
    browsersync = require("browser-sync").create(),
    fileinclude = require("gulp-file-include"),
    del = require("del"),
    autoprefixer = require("gulp-autoprefixer"),
    cleancss = require("gulp-clean-css"),
    rename = require("gulp-rename"),
    groupmedia = require("gulp-group-css-media-queries"),
    uglify = require("gulp-uglify-es").default,
    imagemin = require("gulp-imagemin"),
    webp = require("gulp-webp"),
    path = require('path'),
    scss = require("gulp-sass");

scss.compiler = require("node-sass"); // Переназначаем компилирование

//пути
let project_folder = "dist",
    source_folder = "src",
    paths = {
        build: {
            html: project_folder + "/",
            css: project_folder + "/",
            js: project_folder + "/",
            img: project_folder + "/img/",
            fonts: project_folder + "/fonts/",
        },
        src: {
            html: [source_folder + "/html/*.html", "!" + source_folder + "/html/_*.html"],
            css: [source_folder + "/scss/style.scss", "!" + source_folder + "/scss/_*.scss"],
            js: source_folder + "/js/script.js",
            img: source_folder + "/static/img/**/*.{jpg,png,svg,gif,ico,webp}",
            fonts: source_folder + "/static/fonts/*.{ttf,woff,woff2}",
        },
        watch: {
            html: source_folder + "/html/**/*.html",
            css: source_folder + "/scss/**/*.scss",
            js: source_folder + "/js/**/*.js",
            img: source_folder + "/static/img/**/*.{jpg,png,svg,gif,ico,webp}",
        },
        clean: "./" + project_folder + "/",
    };

//настройка сервера
function browserSync() {
    browsersync.init({
        server: {
            baseDir: "./" + project_folder + "/",
        },
        port: 3000,
        notify: false,
    });
}

//обработка html
function html() {
    return src(paths.src.html)
        .pipe(fileinclude({
                prefix: "@@",
                basepath: "./src",
            }).on("error", function (error) {
                console.error(error);
            })
        )
        .pipe(dest(paths.build.html))
        .pipe(browsersync.stream())
}

//обработка стилей
//версия для build сборки
function css() {
    return src(paths.src.css)
        .pipe(scss().on('error', scss.logError))
        .pipe(
            scss({
                outputStyle: "expanded",
            }),
        )
        .pipe(groupmedia())
        .pipe(
            autoprefixer({
                overrideBrowserlist: ["last 5 versions"],
                cascade: true,
            }),
        )
        .pipe(dest(paths.build.css))
        .pipe(cleancss ({
                level: {
                    1: {
                        all: true,
                        normalizeUrls: false,
                    },
                    2: {
                        restructureRules: true,
                    },
                },
            })
        )
        .pipe(
            rename({
                extname: ".min.css",
            }),
        )
        .pipe(dest(paths.build.css))
        .pipe(browsersync.stream())
}

//версия для dev сборки
function cssDev() {
    return src(paths.src.css)
        .pipe(scss().on('error', scss.logError))
        .pipe(
            scss({
                outputStyle: "expanded",
            }),
        )
        .pipe(
            autoprefixer({
                overrideBrowserlist: ["last 5 versions"],
                cascade: true,
            }),
        )
        .pipe(dest(paths.build.css))
        .pipe(
            rename({
                extname: ".min.css",
            }),
        )
        .pipe(dest(paths.build.css))
        .pipe(browsersync.stream())
}

//обработка js
function js() {
    return src(paths.src.js)
        .pipe(fileinclude())
        .pipe(dest(paths.build.js))
        .pipe(uglify())
        .pipe(
            rename({
                extname: ".min.js"
            }),
        )
        .pipe(dest(paths.build.js))
        .pipe(browsersync.stream())
}

//обработка картинок
//версия для build сборки
function images() {
    return src(paths.src.img)
        .pipe(
            webp({
                quality: 70,
            })
        )
        .pipe(dest(paths.build.img))
        .pipe(src(paths.src.img))
        .pipe(
            imagemin({
                progressive: true,
                svgPlugins: [{removeViewBox: false}],
                interlaced: true,
                optimizationLevel: 7, // 0 to 7
            })
        )
        .pipe(dest(paths.build.img))
        .pipe(browsersync.stream())
}

//версия для dev сборки
function imagesDev() {
    return src(paths.src.img)
        .pipe(
            webp({
                quality: 70,
            })
        )
        .pipe(dest(paths.build.img))
        .pipe(src(paths.src.img))
        .pipe(dest(paths.build.img))
        .pipe(browsersync.stream())
}

//обработка шрифтов
function fonts() {
    return src(paths.src.fonts)
        .pipe(dest(paths.build.fonts))
}

//слежка за файлами
//версия для build сборки
function watchFiles() {
    gulp.watch([paths.watch.html], html);
    gulp.watch([paths.watch.css], css);
    gulp.watch([paths.watch.js], js);
    gulp.watch([paths.watch.img], images);
}

//версия для dev сборки
function watchFilesDev() {
    gulp.watch([paths.watch.html], html);
    gulp.watch([paths.watch.css], cssDev);
    gulp.watch([paths.watch.js], js);
    gulp.watch([paths.watch.img], imagesDev);
}

//очистка dist папки
function clean() {
    return del(paths.clean)
}

//таски
const build = gulp.parallel(gulp.series(clean, gulp.parallel(js, css, html, images, fonts)), watchFiles, browserSync),
    dev = gulp.parallel(gulp.series(clean, gulp.parallel(js, cssDev, html, imagesDev, fonts)), watchFilesDev, browserSync);

exports.html = html;
exports.css = css;
exports.cssDev = cssDev;
exports.js = js;
exports.images = images;
exports.imagesDev = imagesDev;
exports.fonts = fonts;
exports.build = build;
exports.dev = dev;
exports.default = build;