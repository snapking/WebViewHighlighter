var guidelines = {
    
highlighter: null,
    searchResultClassName : "SearchResult",
    indice : 1,
    
init: function () {
    this.highlighter = rangy.createHighlighter();
    this.highlighter.addClassApplier(rangy.createCssClassApplier("HighLighto", {
                                                                 normalize: true
                                                                 }));
},
    
createNoteFromSelection: function () {
    var oldSerializedHighlights = this.highlighter.serialize();
    var selection = rangy.getSelection();
    this.highlighter.highlightSelection("HighLighto", selection);
    var newSerializedHighlights = this.highlighter.serialize();
    var noteId = this.getId(oldSerializedHighlights, newSerializedHighlights);
    
    var selectionString = selection.toString();
    
    var element = selection.nativeSelection.anchorNode.parentElement;
    $(element).attr('id', 'note_' + noteId);
    $(element).unbind('click');
    $(element).click(function () {
                     //window.guidelines.noteClicked($(this).attr('id'));
                     document.location = 'glc://note/' + noteId;
                     });
    
    rangy.getSelection().removeAllRanges();
    
    var note = {
        "noteId": noteId,
        "serializedHighlights": newSerializedHighlights,
        "selection": selectionString,
    };
    return JSON.stringify(note);
},
    
removeNote: function (position, start, end) {
    
    var idName = "id=\"note_" + (position - 1) + "\"";
    
    var start = start - idName.length;
    var end = end - idName.length;
    
    var serializedSelection = "[{\"characterRange\":{\"start\":" + start + ",\"end\":" + end + "},\"backward\":false}]";
    var selection = JSON.parse(serializedSelection);
    
    
    var rangySelection = rangy.getSelection().restoreCharacterRanges(document.body, selection);
    
    this.highlighter.unhighlightSelection(rangySelection);
    //        window.guidelines.noteHighlightRemoved(this.highlighter.serialize());
    
    
    $('#note_' + position).contents().unwrap();
    
    return this.highlighter.serialize();
},
    
scrollToID: function (idName) {
    $(window).scrollTop($('#' + idName).offset().top);
},
    
highliteInitialSelections: function (serializedHighlights) {
    this.removeAllHighlights();
    this.highlighter.deserialize(serializedHighlights);
    
    var highlights = serializedHighlights.split("|");
    if (highlights.length == 1) return;
    
    for (index = 1; index < highlights.length; ++index) {
        var hl = highlights[index];
        var parts = hl.split("$"); console.log(parts);
        var id = parts[2];
        
        var start = parseInt(parts[0]);// - idName.length;
        var end = parseInt(parts[1]);// - idName.length;
        
        var serializedSelection = "[{\"characterRange\":{\"start\":" + start + ",\"end\":" + end + "},\"backward\":false}]";
        var selection = JSON.parse(serializedSelection); console.log(selection);
        rangy.getSelection().restoreCharacterRanges(document.body, selection);
        
        var element = rangy.getSelection().nativeSelection.anchorNode.parentElement;
        $(element).attr('id', 'note_' + id);
        $(element).unbind('click');
        $(element).click(function () {
                         //window.guidelines.noteClicked($(this).attr('id'));
                         document.location = 'glc://note/' + id;
                         });
    }
    
    return this.highlighter.serialize();
},

removeAllHighlights: function () {
    $('.HighLighto').each(function (index) {
                          $(this).contents().unwrap();
                          });
    this.highlighter.removeAllHighlights();
},

    /**
     * Document Height
     */
getDocHeight: function () {
    return document.height == null ? $(document).height() : document.height;
},
    /**
     * Copy
     */
copy: function () {
    var selection = rangy.getSelection();
    window.guidelines.copyToClipboard(selection.toString());
},
    
    /**
     * Get selected html content
     */
getHTMLOfSelection: function () {
    var range;
    if (document.selection && document.selection.createRange) {
        
        range = document.selection.createRange();
        return range.htmlText;
        
    } else if (window.getSelection) {
        
        var selection = window.getSelection();
        if (selection.rangeCount > 0) {
            range = selection.getRangeAt(0);
            var clonedSelection = range.cloneContents();
            var div = document.createElement('div');
            div.appendChild(clonedSelection);
            return div.innerHTML;
        } else {
            return '';
        }
    } else {
        return '';
    }
},
    
    /**
     * Get HTML content
     */
getHtmlContent: function () {
    var html = document.getElementsByTagName('html')[0].innerHTML;
    window.guidelines.htmlContent(html);
},
    
    /**
     * Ranges
     */
Range: function (s, e, i, c) {
    this.start = s;
    this.end = e;
    this.id = i;
    this.className = c;
},
    
getRanges: function (old) {
    var ranges = [];
    var sections = old.split("|");
    if (sections.length > 1) {
        for (var i = 1; i < sections.length; i++) {
            var parts = sections[i].split("$");
            if (parts.length > 0) {
                ranges.push(new this.Range(parts[0], parts[1], parts[2], parts[3]));
            }
        }
    }
    return ranges;
},
    
containsRange: function (array, range) {
    for (var i = 0; i < array.length; i++) {
        var arrayRange = array[i];
        if (arrayRange.start == range.start && arrayRange.end == range.end) {
            return true;
        }
    }
    return false;
},
    
getId: function (oldSerialized, newSerialized) {
    var id = -1;
    var oldRanges = this.getRanges(oldSerialized);
    var newRanges = this.getRanges(newSerialized);
    
    for (var i = 0; i < newRanges.length; i++) {
        if (!this.containsRange(oldRanges, newRanges[i])) {
            return newRanges[i].id;
        }
    }
    return id;
},
nextSearch: function() {
    $( '.' + this.searchResultClassName ).each(function( index ) {
                                               if(index == indice){
                                               $(window).scrollTop($(this).offset().top);
                                               return false;
                                               }
                                               });
    indice++;
    
    var resultSize = $( '.' + this.searchResultClassName ).size();
    if(indice >= resultSize){
        indice = 0;
    }
},
    
performSearch: function (searchQuery) {
    var cssClassApplierModule = rangy.modules.ClassApplier;
    var searchResultApplier = rangy.createClassApplier(this.searchResultClassName);
    
    // Remove existing highlights && reset index
    var range = rangy.createRange();
    var searchScopeRange = rangy.createRange();
    searchScopeRange.selectNodeContents(document.body);
    indice = 1;
    
    var options = {
    caseSensitive: false,
    wholeWordsOnly: false,
    withinRange: searchScopeRange,
    direction: "forward" // This is redundant because "forward" is the default
    };
    
    range.selectNodeContents(document.body);
    searchResultApplier.undoToRange(range);
    
    if (searchQuery !== "") {
        // Iterate over matches
        var jumpedToFirst = false;
        while (range.findText(searchQuery, options)) {
            
            // range now encompasses the first text match
            searchResultApplier.applyToRange(range);
            
            if(!jumpedToFirst){
                $(window).scrollTop($('.' + this.searchResultClassName).offset().top);
                jumpedToFirst = true;
            }
            
            // Collapse the range to the position immediately after the match
            range.collapse(false);
        }
    }
    
},
    
    
};