import { createClient } from 'https://cdn.jsdelivr.net/npm/webdav@5.8.0/+esm'

const client = createClient(
    "http://localhost:8080",
    {
        username: "john",
        password: "doe"
    }
);

class Path {
	constructor(input) {
		// Initialize list from input string or array
		if (typeof input === 'string') {
			this.list = input.split('/').filter(s => s !== '');
		} else {
			this.list = input || [];
		}
	}

	as_list() {
		// Return the path as a list
		return this.list;
	}

	as_string() {
		// Join the list into a string separated by '/'
		return this.list.join('/');
	}

	as_strings() {
		// Return a list of strings showing the path at each depth
		return this.list.map((item, index) => {
			return this.list.slice(0, index + 1).join('/');
		});
	}

	filename() {
		// Return the last item in the list
		return this.list[this.list.length - 1];
	}

	go_deeper(subPath) {
		// Add subPath to the current path
		if (typeof subPath === 'string') {
			this.list = this.list.concat(subPath.split('/').filter(s => s !== ''));
		} else if (Array.isArray(subPath)) {
			this.list = this.list.concat(subPath);
		}
		console.log("Changed Path: " + this.as_string());
	}

	go_up(level = 1) {
		// Remove the specified number of levels from the end of the path
		this.list = this.list.slice(0, Math.max(0, this.list.length - level));
	}
}

// All files currently in the clipboard
var clipboard = [];
// Is the clipboard a copy or cut
var clipboard_copy = false;
var path = new Path();
var files;





// Build Filelist
async function updateFiles() {

	// Get breadcrumb and template elements
    var breadcrumbs = document.getElementById("breadcrumbs");
    var template = document.getElementById("breadcrumb-template");
    
    // Clear existing breadcrumbs
    breadcrumbs.innerHTML = "";

    // Add "home" breadcrumb
    var li = template.content.querySelector("li").cloneNode(true);
    li.querySelector("a").textContent = "home";
    li.onclick = () => setPath([]);
    breadcrumbs.appendChild(li);

    // Add breadcrumbs for each directory in the path
    for (const directory in path.as_list()) {
        var li = template.content.querySelector("li").cloneNode(true);
        li.querySelector("a").textContent = path.as_list()[directory];
        li.onclick = () => setPath(path.as_list().slice(0, directory + 1));
        breadcrumbs.appendChild(li);
    }
    
    // Fetch the list of files from the API
    //files = await rustdrive.api.file_list(path.as_string()); 
    files = await client.getDirectoryContents(path.as_string())
    var filelist = document.getElementById("filelist");
    var template = document.getElementById("file-template");

    // Clear existing file list
    filelist.innerHTML = "";

    // Add each file or folder to the file list
    for (const file in files) {
        var li = template.content.querySelector("li").cloneNode(true);
        li.textContent = files[file].basename;
		//li.onclick = () => showInfo(files[file].name);
        if (files[file].type == "directory") {
            li.ondblclick = () => openFolder(files[file].basename);
        } else {
            li.ondblclick = () => openFile(files[file].basename);
        }
        filelist.appendChild(li);
    }

}




// Implement context menu
document.addEventListener('contextmenu', function(event) {
	// Prevent the default context menu
	event.preventDefault();
	// Get the context menu
	const fileMenu = document.getElementById('context-menu-files');
	const emptyMenu = document.getElementById('context-menu-empty');

	// Find the target file
	const target = event.target.closest('.filelist-file');

	// If no file was found
	if (!target) {
		toggleSelection(event);
		// Hide the file menu
		fileMenu.style.display = 'none';
		// Set the position of the menu
		emptyMenu.style.display = 'block';
		emptyMenu.style.left = `${event.pageX}px`;
		emptyMenu.style.top = `${event.pageY}px`;

		
	} else {
		// select the file, if it was not selected
		if (!target.classList.contains('active')) {
			toggleSelection(event);
		}
		// Hide the empty menu
		emptyMenu.style.display = 'none';
		// Set the position of the menu
		fileMenu.style.display = 'block';
		fileMenu.style.left = `${event.pageX}px`;
		fileMenu.style.top = `${event.pageY}px`;
		
	}
});

// Set the download button
document.getElementById('context-menu-download').onclick = () => {
	var items = document.querySelectorAll('.filelist-file');
	// count all the active items
	items.forEach(function(item) {
		if (item.classList.contains('active')) {
			download_file(new Path( path.as_string() + "/" + item.textContent ));
		}
	});

}

document.body.addEventListener("keydown", function(event) {
    // Detect Ctrl+R (or Cmd+R on Mac) for reload
    if ((event.ctrlKey || event.metaKey) && event.key === "v") {
        event.preventDefault();
        if (clipboard_copy) {
			clipboard.forEach( async function(item) {
				//await rustdrive.api.file_copy(item.as_string(), (path.as_string() === '' ? '' : path.as_string() + "/") + item.filename());
				updateFiles();
			});
		} else {
			clipboard.forEach(async function(item) {
				//await rustdrive.api.file_rename(item.as_string(), (path.as_string() === '' ? '' : path.as_string() + "/") + item.filename());
				updateFiles();
			});
		}
    }

    // Detect Ctrl+C for copy
    if ((event.ctrlKey || event.metaKey) && event.key === "c") {
        event.preventDefault();
        
		var items = document.querySelectorAll('.filelist-file');
		// clear the clipboard
		clipboard = [];
		clipboard_copy = true;
		// count all the active items
		items.forEach(function(item) {
			if (item.classList.contains('active')) {
				clipboard.push(new Path( path.as_string() + "/" + item.textContent ));
			}
		});
    }

	// Detect Ctrl+X for copy
    if ((event.ctrlKey || event.metaKey) && event.key === "x") {
        event.preventDefault();
        
		var items = document.querySelectorAll('.filelist-file');
		// clear the clipboard
		clipboard = [];
		clipboard_copy = false;
		// count all the active items
		items.forEach(function(item) {
			if (item.classList.contains('active')) {
				clipboard.push(new Path( path.as_string() + "/" + item.textContent ));
			}
		});
    }

	// Detect Ctrl+S for download
    if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        var items = document.querySelectorAll('.filelist-file');
		// count all the active items
		items.forEach(function(item) {
			if (item.classList.contains('active')) {
				download_file(new Path( path.as_string() + "/" + item.textContent ));
			}
		});
    }
});


// set the copy button
document.getElementById('context-menu-copy').onclick = () => {
	var items = document.querySelectorAll('.filelist-file');
	// clear the clipboard
	clipboard = [];
	clipboard_copy = true;
	// count all the active items
	items.forEach(function(item) {
		if (item.classList.contains('active')) {
			clipboard.push(new Path( path.as_string() + "/" + item.textContent ));
		}
	});
}

// set the cut button
document.getElementById('context-menu-cut').onclick = () => {
	var items = document.querySelectorAll('.filelist-file');
	// clear the clipboard
	clipboard = [];
	clipboard_copy = false;
	// count all the active items
	items.forEach(function(item) {
		if (item.classList.contains('active')) {
			clipboard.push(new Path( path.as_string() + "/" + item.textContent ));
		}
	});
}

document.getElementById('context-menu-paste').onclick = () => {
	if (clipboard_copy) {
		clipboard.forEach( async function(item) {
			//await rustdrive.api.file_copy(item.as_string(), (path.as_string() === '' ? '' : path.as_string() + "/") + item.filename());
			updateFiles();
		});
	} else {
		clipboard.forEach(async function(item) {
			//await rustdrive.api.file_rename(item.as_string(), (path.as_string() === '' ? '' : path.as_string() + "/") + item.filename());
			updateFiles();
		});
	}
	
}

// Toggle file selection
function toggleSelection(event) {
	// Find the target file
	const target = event.target.closest('.filelist-file');
	// return if no file was found
	if (!target) {
		var items = document.querySelectorAll('.filelist-file');
		items.forEach(function(item) {
			item.classList.remove('active');
		});
	} else {
		if (event.metaKey) {
			target.classList.toggle('active');
		} else {
			// Remove the 'highlight' class from all <li> elements
			var items = document.querySelectorAll('.filelist-file');
			items.forEach(function(item) {
				item.classList.remove('active');
			});
			// Add the 'highlight' class to the clicked <li>
			target.classList.add('active');
		}
	}
	// Check if the clicked element is an <li> with the class 'list-group-item'

	var items = document.querySelectorAll('.filelist-file');
	// count all the active items
	var count = 0;
	items.forEach(function(item) {
		if (item.classList.contains('active')) {
			count++;
		}
	});
	// display the count in the inspector
	document.getElementById('inspector').innerHTML = count + " files selected";
}

// Hide context menu
document.addEventListener('click', function(e) {
	// Toggle file selection
	toggleSelection(e);

	// Hide the context menu
	const menu = document.getElementById('context-menu-files');
	const emptyMenu = document.getElementById('context-menu-empty');
	menu.style.display = 'none';
	emptyMenu.style.display = 'none';
});

// Show infos of files
var Inspector = document.getElementById("inspector");
function showInfo(filename) {
	Inspector.innerHTML = "<h3>" + filename + "</h3>";
}
window.showInfo = showInfo;

function openFile(filename) {
	Inspector.innerHTML = "<h3>Opening: " + filename + "</h3>";
}
window.openFile = openFile;

function openFolder(filename) {
	path.go_deeper(filename)
	updateFiles();
}
window.openFolder = openFolder;

function goBack() {
	path.go_up();
	updateFiles();
}

window.goUp = goBack;

function setPath(new_path) {
	path = new Path(new_path);
	updateFiles();
}
window.setPath = setPath;


updateFiles();