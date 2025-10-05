import { Dir } from "node:fs";
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

async function buildMdFromString(buffer: string): Promise<string> {
  return await marked.parse(buffer);
}

async function buildMdFromDir(dir: Dir): Promise<void> {
  // Determine where to stick the md in our app shell
  const app_html = await readFile(APP_PATH, { encoding: "utf8" });
  const app_tag_indices = {
    start: app_html.indexOf(MAIN_TAG.start) + MAIN_TAG.start.length,
    end: app_html.indexOf(MAIN_TAG.end),
  }

  if (app_tag_indices.start != app_tag_indices.end) {
    throw new Error("Failed to determine the location of the main tag.");
  }

  const app_tag_index = app_tag_indices.start; // doesn't really matter what we pick here

  const app_shell = {
    start: app_html.slice(0, app_tag_index),
    end: app_html.slice(app_tag_index),
  }

  for await (const dirent of dir) {
    if (!dirent.isFile() || !dirent.name.endsWith(".md")) {
      continue
    }

    const page_file_name = dirent.name.replace(".md", "");
    const input_path = path.posix.join(dirent.parentPath, page_file_name + ".md");
    const output_html_path = path.posix.join(CONTENT_OUTPUT_PATH, page_file_name + ".html");
    const output_main_html_path = path.posix.join(CONTENT_OUTPUT_PATH, page_file_name + ".main.html");

    const md = await readFile(input_path, { encoding: "utf8" }).then(
      (result) => buildMdFromString(result),
    ).then(
      (result) => { return result }
    );

    const app_wrapped_md = app_shell.start + md + app_shell.end;

    // for each markdown file, we will write the following:
    // file.html, which contains the app specified and will be served "defaultly"
    // file.main.html, which contains purely the md (what can be loaded into the page by the app)
    fs.writeFile(output_html_path, app_wrapped_md, { flag: "w+" });
    fs.writeFile(output_main_html_path, md, { flag: "w+" });
  }
}

opendir(CONTENT_BASE_PATH, { recursive: true }).then(
  (result: Dir) => buildMdFromDir(result),
);
