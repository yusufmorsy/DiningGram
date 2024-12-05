/**
 * Function: Creates an event listener that, when form is submitted, encodes target file into a base64 
 * string and stores it locally in another HTML tag, which can be passed in req.body in form submission
 * 
 * @param {HTMLElement} formId - Element id of the HTML form element that contains the HTML input element containing the file upload
 * @param {HTMLElement} fileInputId - Element id of the aforementioned HTML input element that contains the target file (i.e. uses type="file")
 * @param {HTMLElement} storeStringInputId - Element id of the HTML text element that will store the Base64 string of "fileInputId"

  Here is an example of how it would look like in HTML:

  ```html
  <form id="uploadFileForm" action="/encodeFile" method="POST">
    <div class="mb-3">
      <input type="file" class="form-control" id="uploadFileHere" required>
      <input type="hidden" id="storesBase64Here" name="picture">
    </div>
    <button type="submit" class="btn btn-primary w-100">Encode File</button>
  </form>
  <script src="/js/filebase64encode.js"></script>
  <script>EncodeFileAsBase64("uploadFileForm", "uploadFileHere", "storesBase64Here");</script>
  ```
  Here, the API route in JS will handle the base64 string as:

  const { picture } = req.body;  // Or const someVar = req.body.picture;
  
  Since "picture" is the name of the element with id, "storesBase64Here".

  This method was chosen over Base64EncodeFile(fileInputId) that would return the base64
  string directly as FileReader is asynchronous, so it would have required using Promises and it
  would be more complicated than necessary.
*/
function EncodeFileAsBase64(formId, fileInputId, storeStringInputId){
  const form = document.getElementById(formId);
  const fileInput = document.getElementById(fileInputId);
  const storeBase64String = document.getElementById(storeStringInputId);

  // Missing Parameters
  if (!form || !fileInput || !storeBase64String){
    console.error("Missing Parameters; File encoding failed");
    return;
  }

  /*
    Upon submitting form, this will take the file that was uploaded and, using the FileReader API,
    encode it into a base64 string.

    User can send files of different formats such as, but not limited to:
      - .jpg
      - .jpeg
      - .png
      - etc.

    However, this will throw an error if user tries to upload an image with MASSIVE size.
      - Proof: Tried uploading a 1.15 MB image
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
    // if (!file) {
    //   alert("Please upload a picture before submitting.");
    //   event.preventDefault();
    //   return;
    // }

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
}