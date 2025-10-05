var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
import fs, { opendir, readFile } from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";
marked.use({ gfm: true, async: false });
const CONTENT_BASE_PATH = path.posix.join("content");
const CONTENT_OUTPUT_PATH = path.posix.join("dist");
const APP_PATH = path.posix.join("dist/index.html");
const MAIN_TAG = {
    start: "<main id=\"app\">",
    end: "</main>",
};
function buildMdFromString(buffer) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield marked.parse(buffer);
    });
}
function buildMdFromDir(dir) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, dir_1, dir_1_1;
        var _b, e_1, _c, _d;
        // Determine where to stick the md in our app shell
        const app_html = yield readFile(APP_PATH, { encoding: "utf8" });
        const app_tag_indices = {
            start: app_html.indexOf(MAIN_TAG.start) + MAIN_TAG.start.length,
            end: app_html.indexOf(MAIN_TAG.end),
        };
        if (app_tag_indices.start != app_tag_indices.end) {
            throw new Error("Failed to determine the location of the main tag.");
        }
        const app_tag_index = app_tag_indices.start; // doesn't really matter what we pick here
        const app_shell = {
            start: app_html.slice(0, app_tag_index),
            end: app_html.slice(app_tag_index),
        };
        try {
            for (_a = true, dir_1 = __asyncValues(dir); dir_1_1 = yield dir_1.next(), _b = dir_1_1.done, !_b; _a = true) {
                _d = dir_1_1.value;
                _a = false;
                const dirent = _d;
                if (!dirent.isFile() || !dirent.name.endsWith(".md")) {
                    continue;
                }
                const page_file_name = dirent.name.replace(".md", "");
                const input_path = path.posix.join(dirent.parentPath, page_file_name + ".md");
                const output_html_path = path.posix.join(CONTENT_OUTPUT_PATH, page_file_name + ".html");
                const output_main_html_path = path.posix.join(CONTENT_OUTPUT_PATH, page_file_name + ".main.html");
                const md = yield readFile(input_path, { encoding: "utf8" }).then((result) => buildMdFromString(result)).then((result) => { return result; });
                const app_wrapped_md = app_shell.start + md + app_shell.end;
                // for each markdown file, we will write the following:
                // file.html, which contains the app specified and will be served "defaultly"
                // file.main.html, which contains purely the md (what can be loaded into the page by the app)
                fs.writeFile(output_html_path, app_wrapped_md, { flag: "w+" });
                fs.writeFile(output_main_html_path, md, { flag: "w+" });
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_a && !_b && (_c = dir_1.return)) yield _c.call(dir_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    });
}
opendir(CONTENT_BASE_PATH, { recursive: true }).then((result) => buildMdFromDir(result));
