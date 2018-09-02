// Core "pjax" functionality for the site, handles loading the search
// submissions via AJAX and avoiding a full page reload.
(function () {
  // Delegate submit events for the search form...
  document.body.addEventListener('submit', function (evt) {
    if (evt.target.matches('[data-search-form]')) {
      handleFormSubmit(evt);
    }
  });

  // Handle click events on the pagination buttons...
  document.body.addEventListener('click', function (evt) {
    if (evt.target.matches('[data-search-form] button[type=submit][value]')) {
      handleSubmitButtonClick(evt);
    }
  });

  // Intercepts the search form submission and sends it via AJAX and replacing
  // the document content with the response.
  function handleFormSubmit(evt) {
    evt.preventDefault();
    var form = evt.target;
    var query = encodeForm(form);

    // Append query string to action
    var url = form.action + (form.action.indexOf('?') >=0 ? '&' : '?') + query;

    var xhr = new XMLHttpRequest();
    xhr.open(form.method || 'GET', url);
    xhr.setRequestHeader('XMLHTTPRequest', 'true');
    xhr.responseType = 'text';

    xhr.addEventListener('load', function (evt) {
      var main = document.querySelector('[role=main]');
      main.innerHTML = xhr.response;
      main.scrollIntoView(true);
      // Use replaceState to avoid having to deal with popstate.
      // TODO: Use pushState...
      history.replaceState({}, null, url);
    });
    xhr.addEventListener('error', function (evt) {
      // Lazy, error handling, just try submitting the form again.
      form.submit();
    });
    xhr.send();
  }

  // Browsers submit the "value" of a <button> element when submitting
  // a form and include this in the request. Unfortunately we don't have
  // access to this action at the JavaScript layer, so fake it by injecting
  // a hidden input.
  function handleSubmitButtonClick(evt) {
    var button = evt.target;
    var form = button.form;
    var input = document.createElement('input');
    input.type = 'hidden';
    input.name = button.name;
    input.value = button.value;
    form.appendChild(input);
  }

  // Returns form as a query string. Uses FormData but supports IE11 (maybe)..
  function encodeForm(form) {
    var elements = toArray(form.elements);
    var params = {};

    // De-dupe the elements and always take the last one.
    elements.forEach(function (el) {
      if (el.name) {
        params[el.name] = el.value;
      }
    });

    return Object.keys(params).map(function (key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    }).join('&');
  }

  function toArray(obj) {
    return [].slice.apply(obj);
  }
})();
