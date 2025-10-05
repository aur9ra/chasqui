import { useState, useEffect } from 'preact/hooks'

/*
functions to handle the state of the cache
*/

// the ANCHOR_PAGE_CONTENT_CACHE is the browser's way of caching anchor links it comes across

// right now we don't need multiple copies of the page content cache.
// in the future, it may be wise to do so. however, as the current design
// philosophy of this project stands, the memory footprint of this will guaranteeably
// be quite low.

let ANCHOR_PAGE_CONTENT_CACHE = new Map<string, string>();

// currently, the functions associated with the cache are quite primitive, just calling
// various methods of the base ANCHOR_PAGE_CONTENT_CACHE as an abstraction.

async function cacheHrefContent(href: string) {
  if (ANCHOR_PAGE_CONTENT_CACHE.has(href)) {
    return;
  }
  ANCHOR_PAGE_CONTENT_CACHE.set(href, await queryHrefContent(href))
}

async function getHrefContent(href: string): Promise<string> {
  if (ANCHOR_PAGE_CONTENT_CACHE.has(href)) {
    return ANCHOR_PAGE_CONTENT_CACHE.get(href) as string;
  } else {
    console.log(`${href} is not present in ANCHOR_PAGE_CONTENT_CACHE. Caching. (Below is the cache:)`);
    console.log(ANCHOR_PAGE_CONTENT_CACHE);
    cacheHrefContent(href)
    return ANCHOR_PAGE_CONTENT_CACHE.get(href) as string;
  }
}

/*
functions to deal with the anchor tags in the page
*/

function isHTMLAnchorElement(a: any): a is HTMLAnchorElement {
  return a instanceof HTMLAnchorElement;
}

function getAnchorElements(doc: Document): Array<HTMLAnchorElement> {
  let arr = [];
  for (let i = 0; i < doc.links.length; i++) {
    arr.push(doc.links.item(i));
  }

  return arr.filter(ele => ele instanceof HTMLAnchorElement);
}

async function queryHrefContent(href: string): Promise<string> {
  const uri = href.replace(".html", ".main.html");

  try {
    return fetch(uri).then(
      result => result.text()
    ).then(
      result => { return Promise.resolve(result) }
    )
  } catch (error: any) {
    return Promise.reject(error);
  }
}

async function queryAnchorContent(a: HTMLAnchorElement): Promise<string> {
  return await queryHrefContent(a.href);
}

/*
page, main functionality. the Driver
*/

export function Page() {
  // when we click on the anchor, we want the following to happen:
  // // 1. determine if the HTML content of the resource has been cached
  // // 2. if so, we want to call a function with the cached page content.
  // // this function will replace the body of the document, update the history, etc.
  // // 3. return a status code (to be implemented later)
  const onAnchorClick = async (e: Event) => {
    e.preventDefault();

    const a = e.target;
    if (isHTMLAnchorElement(a)) {
      handleHrefChangeState(a.href);
    }
  }
  const handleHrefChangeState = async (href: string) => {
    setPageHref(href);
  }

  const handlePopStateEvent = async (e: PopStateEvent) => {
    setPageHref(e.state.href, false);
  }

  // when we update the page, we need to tell preact that we are now rerendering the page.
  // this is the main callback of the program for anchor clicks.
  const [pageContent, _setPageContent] = useState(document.getElementById("app")!.innerHTML);

  const setPageHref = (href: string, push_state: boolean = true) => {
    getHrefContent(href).then(
      html => {
        _setPageContent(html);
        document.getElementById("app")!.innerHTML = html;

        if (push_state) {
          history.pushState({ href }, "", href);
        }
      }
    );
  }

  useEffect(() => {
    window.addEventListener("popstate", async (e: PopStateEvent) => {
      handlePopStateEvent(e);
      history.replaceState({ href: window.location.href }, "", window.location.href);
    })
  }, [])

  // iterate over links (anchor elements) in the current document and cache the html main tag in plaintext
  useEffect(() => {
    getAnchorElements(document).map((a: HTMLAnchorElement) => {
      cacheHrefContent(a.href);
      a.addEventListener("click", onAnchorClick)
    })
  }, [pageContent]);

  if (document.getElementById("app")?.innerText.length != 0) {
    // the text of the page is already loaded
    return;
  }

  return "No page text found.";
};

