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


async function cacheHrefContent(href: string): Promise<boolean> {
  if (ANCHOR_PAGE_CONTENT_CACHE.has(href)) {
    return Promise.resolve(true);
  }

  // query the server for content
  // if it finds content, great, cache it
  // else, send the error up the stack
  return queryHrefContent(href).then(
    result => {
      ANCHOR_PAGE_CONTENT_CACHE.set(href, result);
      return Promise.resolve(true)
    },
    error => { return Promise.reject(error) }
  );
}

// query the server for an href
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

async function getHrefContent(href: string): Promise<string | null> {
  // determine if the user is requesting at root
  if (ANCHOR_PAGE_CONTENT_CACHE.has(href)) {
    return ANCHOR_PAGE_CONTENT_CACHE.get(href) as string;
  } else {
    cacheHrefContent(href)
    return ANCHOR_PAGE_CONTENT_CACHE.get(href) as string;
  }
}

/*
functions to deal with the anchor tags in the page
*/

function getAnchorElements(doc: Document): Array<HTMLAnchorElement> {
  let arr = [];
  for (let i = 0; i < doc.links.length; i++) {
    arr.push(doc.links.item(i));
  }

  return arr.filter(ele => ele instanceof HTMLAnchorElement);
}

/*
page, main functionality. the Driver
*/

const getNormalHref = (href: string, pathname: string): string => {
  if (pathname === "/") {
    return href + "index.html";
  } else {
    return href;
  }
}

export function Page() {
  const onAnchorClick = async (e: MouseEvent) => {
    e.preventDefault();

    const a = e.target!;
    if (a instanceof HTMLAnchorElement) {
      const href = getNormalHref(a.href, a.pathname);
      updatePageHref(href);
    }
  }

  // when we update the page, we need to tell preact that we are now rerendering the page.
  // this is the main callback of the program.
  const [pageContent, _setPageContent] = useState(document.getElementById("app")!.innerHTML);

  const updatePageHref = (href: string, push_state: boolean = true) => {
    getHrefContent(href).then(
      html => {
        _setPageContent(html);
        document.getElementById("app")!.innerHTML = html;

        if (push_state) {
          history.pushState({ href: href }, "", href);
        }
      }
    );
  }

  // when loading the page, we need to add state to the history entry
  // the browser generates
  // 
  // we also need to add the event listener for popstate, i.e. fwd/back
  useEffect(() => {
    // set initial state 
    {
      const href = getNormalHref(window.location.href, window.location.pathname)
      history.replaceState({ href: href }, "", href);
    }

    window.addEventListener("popstate", async (e: PopStateEvent) => {
      const href = e.state.href;
      e.preventDefault();
      updatePageHref(href, false);
      history.replaceState({ href: href }, "", href);
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

  console.log(ANCHOR_PAGE_CONTENT_CACHE);
  return "No page text found.";
};
