
  /*
   *       HELPER FUNCTIONS
   */

  function isContainedByClass(e, cls) { while (e && e.tagName) { if (e.classList.contains(cls)) return true; e = e.parentNode; } return false; }

  function throttle(func, wait, options) {  // from underscorejs
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : Date.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = Date.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  }

  /*
   *       COLLABORATIVE HANDLING
   */
  
  var socket = io(),
    bp = document.getElementById('bigpicture'),
    bpContainer = document.getElementById('bigpicture-container');

  var tempId = 0;

  function emitText() { 
    socket.emit('text', { x: $(this).data('x'), 
                          y: $(this).data('y'), 
                          size: $(this).data('size'), 
                          text: $(this).text(),
                          id: $(this).attr('id') });
  }

  $(bp).on('blur', '.text', emitText);

  $(bp).on('input', '.text', throttle(emitText, 500));
  
  bpContainer.onclick = function(e) {
    if (isContainedByClass(e.target, 'text')) { return; }
    var tb = bigpicture.newText(bigpicture.current.x + (e.clientX) * bigpicture.current.zoom, bigpicture.current.y + (e.clientY) * bigpicture.current.zoom, 20 * bigpicture.current.zoom, '');
    $(tb).attr('id', 'tempId' + tempId);
    socket.emit('temp id', {tempId: tempId}); 
    tempId ++;
    tb.focus();
  };
    
  socket.on('new id', function (data) { $('#tempId' + data.tempId).attr('id', 'id' + data.id); });  
  
  socket.on('text', function (data) { 
    var $tb = $('#' + data.id);
    if ($tb.length) {
      $tb.data('x', data.x).data('y', data.y).data('size', data.size).text(data.text);
      bigpicture.updateTextPosition($tb.get(0));
    }
    else {
      var tb = bigpicture.newText(data.x, data.y, data.size, data.text);
      $(tb).attr('id', data.id);
    }
  });
  
