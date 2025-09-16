

export async function file_list(path) {
    const url = '/files/file-list/' + path;
    const response = await fetch(url);
    return await response.json();
}

export async function get_file(path, download) {
    const url = '/files/' + path + '?download=' + download;
    const a = document.createElement("a");
    a.href = url;
    if (download) {
        a.setAttribute("download", path.split('/').pop());
    }
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
    a.remove();
}
