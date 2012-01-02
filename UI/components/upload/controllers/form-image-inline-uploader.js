uni.observe("component:upload:loaded", function(comp) {

	var view			= comp.view,
		fileUpload 		= view.find(".uploader-upload-files"),
		filelist 		= view.find(".upload-filelist"),
		browseButton 	= view.find(".upload-file-select"),	
		
		//	This will be set on unploader.PostInit, and used variously when we
		//	need to access the upload component's information.
		//
		inputElement	= false,
		
		//	See below. These attributes are used when performing an upload, and for setting
		//	the value of the uploader <input type="file> element.
		//
		//	@see	#PostInit
		//	@see	fileUpload.click
		//
		fieldpath		= view.attr("fieldpath"),
		validation		= view.attr("validation"),
		origfilename	= view.attr("origfilename"),
		itemid			= view.attr("itemid"),
		subitemid		= view.attr("subitemid"),
		imWidth			= view.attr("imageWidth"),
		imHeight	    = view.attr("imageHeight"),

		//	The construction of the uploader object itself.
		//	TODO: move this into the model.
		//
		uploader = new plupload.Uploader({
			runtimes 		: 'html5,flash',
			browse_button 	: browseButton.attr("id"),
			container 		: view.find(".upload-container").attr("id"),
			max_file_size 	: '10mb',
			multi_selection	: false,
			
			//	This is important... must be sent, must be "image-location" for cuts, 
			//	"raw-image" for photo-asset (raw image).
			//
			fileTypeName	: "image-location",
			
			url 			: "/photo-asset/image/upload?create-thumb=yes&asset-id=" + itemid + "&photo-id=" + subitemid + "&file-path=" + origfilename,
			flash_swf_url 	: '',
			filters 		: [{
				title 		: "Image files", 
				extensions 	: uni.data.getProperty("validUploadTypes")
			}]
			
			//resize : {width : 320, height : 240, quality : 90}
		});

	browseButton.mouseenter(function() {
		console.log('refresheduploader');
		uploader.refresh();
	});

	uploader.bind('QueueChanged', function(up) {
	});

	uploader.bind('Init', function(up, params) {	
	});
	
	uploader.bind('PostInit', function(up, params) {		

		inputElement = view.find('input[type="file"]');
		
		inputElement
			.attr("fieldpath", fieldpath)
			.attr("validation", validation)
			.attr("fileState", "0")
	});

	fileUpload.click(function(e) {
	
		var f = inputElement.attr("filename");
		
		if(f === undefined) {
			uni.notify("Go ahead an select a new file to upload, first.", "info", "Need a File");
			return;
		}
		
		
	
		uploader.start();
		//e.preventDefault();
	});

	uploader.init();

	uploader.bind('FilesAdded', function(up, files) {
	
		//	Working on single file functionality. Oddly, no built-in way to do
		//	this.  So we simply assume that the latest file added is the desired
		//	file to upload, and shift off the current, keeping the list 
		//	limited to 1 file.
		//
		if(up.files.length > 1) {
			up.files.shift();
		};
		
		var file = files[0];

		filelist.empty();


		filelist.append(
			'<div id="' + file.id + '">' +
				file.name + ' (' + plupload.formatSize(file.size) + ') <b></b>' +
			'</div>');
			
			inputElement.attr("filename", file.name);


		up.refresh(); // Reposition Flash/Silverlight
	});

	uploader.bind('UploadProgress', function(up, file) {
		console.log(file.percent);
	});

	uploader.bind('Error', function(up, err) {
		uni.notify(err.message + " for file: " + (err.file ? err.file.name : "") + " with code: " + err.code, "error", "Uploader Error");
		up.refresh(); // Reposition Flash/Silverlight
	});

	uploader.bind('FileUploaded', function(up, file, resp) {
		$('#' + file.id + " b").html("100%");
		
		//var imLoc	= uni.spawn(uni.json.parse(resp.response).$).createSubjectFacade().find("@key", "raw-image", "item.field").$[0].$
		
		//	A file has been uploaded, and what we have gotten back is an item record.  Now we need
		//	to update the interface, and the photo-asset model, so that the form the user is
		//	looking at is updated, and should it be saved, the model is updated.
		//
		var s		= uni.spawn(uni.json.parse(resp.response).$).createSubjectFacade(),
			//	Find the subItem
			//
			imP 	= s.findPath("@id", subitemid, "item.field"),
			//	Find the 'image-location' field, which will contain the canonical path to image
			//	in its `$` attribute.
			//
			imLoc 	= s.find("@key", "image-location", imP).$[0].$,
			//	Build a file object, which extracts further info from the image path, such
			//	as the image thumbnail.
			//
			im 		= uni.fire("image:augment", { image: imLoc }).$;


		//	Find the thumbnail bound to this control, which will be the only .thumbnail
		//	component contained by this form field (defined within an <LI>).
		//
		view
			.closest("li")
			.find(".ui.components.thumbnail")
			.data("viewController")
				.rebind({
					src			: im.thumbPath,
					fullView	: im.path
				});

		//	Broadcast that the file has been uploaded.
		//
		uni.fire("file:uploaded", {
			view		: view,
			fileOb		: file,
			imLoc		: imLoc,
			imOb		: im
		});
	});
});