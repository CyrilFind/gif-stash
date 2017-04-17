// Helpers
if (typeof String.prototype.isVideo !== 'function') {
    String.prototype.isVideo = function() {
       return(this.match(/\.(gifv|webm|mp4)$/) != null)
    }
}

if (typeof String.prototype.isImage !== 'function') {
    String.prototype.isImage = function() {
		return(this.match(/\.(jpeg|jpg|gif|png)$/) != null)
    }
}


// GIF Stash
function getGifFolderId(callback) {
	var bookmarkFolder = { 'title' : 'GIF Stash' }
	chrome.bookmarks.search(bookmarkFolder, function(node) {
		var folderNode = node[0]
		if (folderNode == undefined) {
			chrome.bookmarks.create(bookmarkFolder)
			getGifFolderId(callback)
		}
		else {
			callback(folderNode.id)
		}
	})
}

var isAdding = false
function addBookmark(parentId, url) {
	if (!isAdding) {
		isAdding = true
		chrome.bookmarks.create({ 'parentId': parentId, 'url': url, 'title': url, 'index': 0 })
		showSnackBar("Added GIF to your stash !", 1000, function() {
			location.reload()
		})
	}
}

var isSnackBarDisplayed = false
function showSnackBar(title, time, callback) {
	if (!isSnackBarDisplayed) {
	    $("#snackbar").addClass("show").html(title)
	    isSnackBarDisplayed = true
	    setTimeout(function() {
	    	isSnackBarDisplayed = false
	 		$("#snackbar").removeClass("show")
	 		callback()
	 	}, time);
	}

}

$(document).ready(function() {
	getGifFolderId(function(id) {
		// Display Add Button if URL is GIF
		chrome.tabs.query({ 'active': true, 'lastFocusedWindow': true }, function (tabs) {
			var url = tabs[0].url
			if (url.isImage() || url.isVideo()) {
				$("#add").click(function() {
					addBookmark(id, url)
				})
			} else {
				$("#add").hide()
			}
		})

		// Display GIFs
		chrome.bookmarks.getChildren(id, function(bookmarks) {
			if (bookmarks.length == 0) {
				$("#gifs").html("No GIFs in your stash... yet !")
			}
			for (i = 0; i < Math.min(bookmarks.length, 1000); i++) {
				var bookmark = bookmarks[i]
				var url = bookmark.url
				var removeButton = "<div class=\"remove\"  data-id=\"" + bookmark.id + "\"> &times; </div>"
				if (url.isVideo()) {
					url = url.replace(new RegExp("(gifv)$"), 'mp4')
					$("#gifs").append("<div class=\"container\">" 
					+"<video class=\"gif\" preload=\"auto\" autoplay=\"autoplay\" loop=\"loop\">"
					+"<source src=\"" + url + "\"></source></video>"
					+ removeButton + "</div>")
				} else {
					$("#gifs").append("<div class=\"container\"><img class=\"gif\" src=\'" + url + "\'>" + removeButton + "</div>")
				}
			}

			// Copy URL to clipboard
			new Clipboard('.gif', {
			    text: function(trigger) {
					showSnackBar("GIF URL copied to clipboard.", 3000)
					var url = trigger.getAttribute('src') || trigger.firstChild.getAttribute('src')
			        return url
			    }
			})

			// Remove GIF from stash
			$(".remove").click(function() {
				chrome.bookmarks.remove(this.getAttribute('data-id'))
				showSnackBar("Removed GIF from stash.", 1000, function() {
					location.reload()
				})
			})

		})
	})
})


