document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("createPostForm");
    const fileInput = document.getElementById("pictureBase64Convert");
    /*
      The base64 string that represents the file above will be stored in the hidden <input> tag
      with the name, 'picture'. This is reduce confusion as to how the string will be sent
      to the POST method for /createpost and 'picture' is already used in the method as a
      variable name, so it would be more time-efficient to do so this way.
     */
    const storeBase64String = document.getElementById("picture");
  
    /*
      Upon submitting form, this will take the file that was uploaded and, using the FileReader API,
      encode it into a base64 string.

      User can send files of different formats such as, but not limited to:
       - .jpg
       - .jpeg
       - .png
       - etc.

      However, this will throw an error if user tries to upload an image with MASSIVE size.
       - Proof: Tried uploading a 363 MB image (it was my wallpaper, which explains the size)
       - Note: I tested a 17 KB image and it works as intended.
       - Caveat: This is not a lossless process. Test this with a high-resolution image and it will
       be noticeably more pixelated.
    */
    form.addEventListener("submit", (event) => {
      const file = fileInput.files[0]; // Get the uploaded file

      /*
        Prevent form submission if lack of file upload (client-side validation might fail*)
        
        *:This is mostly to stop users who remove the 'required' keyword from the html tag
        for the file upload in createpost.hbs using Developer Tools.
      */
      if (!file) {
        alert("Please upload a picture before submitting.");
        event.preventDefault();
        return;
      }
  
      // Creates new instance of FileReader object from the FileReader API
      const reader = new FileReader();

      // Note: Despite being declared first, reader.onload is called after reader.readAsDataURL()
      reader.onload = () => {
        //Store the encoded base64 string in the hidden input tag
        storeBase64String.value = reader.result;
  
        // Form submits with the base64 string stored in 'picture'
        form.submit();
      };
  
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        alert("An error occurred while processing the file.");
      };
  
      // Start reading the file as a Data URL
      reader.readAsDataURL(file);
  
      // Prevent default form submission until the file is processed
      event.preventDefault();
    });
  });