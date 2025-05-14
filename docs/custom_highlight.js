
// This file is a bit of a hack. It allows us to force
// highlighting of line of code. See slides.org for example
// usage. In theory, we could have used highlight.js, but
// I did not like how that dimmed unhighlighted areas and
// generally made the syntax highlighting look ugly.

// ---------------Start clip section-------------------------
// You will need to put the code between here and the
// commend called "end clip section" at the start of
// your HTML file (e.g., via +BEGIN_EXPORT html) so
// that you get these variables and functions defined
// at the start for slides to use them.

if (typeof highlightLineMapper === 'undefined') {
  var highlightLineMapper = {};
}

function highlightSlide(sectionId, lines) {
  highlightLineMapper[sectionId] = new Set(lines)
}

// -----------------End clip section-------------------------


  Reveal.addEventListener('slidechanged', function(event) {
    highlightLinesWithLines(event.currentSlide, highlightLineMapper);    
  });


function highlightLinesWithLines(slide, lineMap) {
  // lineMap is a dictionary like
  //   {section_id_1: Set<number>, section_id_2: Set<number>, ...}
  // where each Set contains line numbers (1-based) to highlight
  const startSpan = '<span class="highlight-line" style="display: inline-block; width: 100%">';
  
  slide.querySelectorAll('.src').forEach(el => {
    // Find the parent section element to get its ID
    let parentSection = el.closest('section');
    let sectionId = parentSection ? parentSection.id : null;
    console.log(`checking section ${sectionId}`);
    
    // Get the set of line numbers to highlight for this section
    let linesToHighlight = sectionId && lineMap[sectionId] 
                         ? lineMap[sectionId] 
                         : null;
    
    // Skip if no line numbers set found for this section
    if (!linesToHighlight) return;
    
    const originalLines = el.innerHTML.split('\n');
    const processedLines = [];
    
    // Process each line, highlighting those whose line number (1-based) is in the set
    originalLines.forEach((line, index) => {
      // Check if this line number (converting to 1-based) should be highlighted
      const lineNumber = index + 1;
      
      if (linesToHighlight.has(lineNumber) && !line.includes('highlight-line')) {
        // Find the position of the first span tag
        const firstSpanIndex = line.indexOf('<span');
        
        if (firstSpanIndex !== -1) {
          // Split the line at the first span tag
          const beforeSpan = line.substring(0, firstSpanIndex);
          const fromSpan = line.substring(firstSpanIndex);
          
          // Wrap only from the first span tag to the end
          processedLines.push(
            `${beforeSpan}${startSpan}${fromSpan}</span>`
          );
        } else {
          // If no span tag found, wrap the entire line
          processedLines.push(`${startSpan}${line}</span>`);
        }
      } else {
        // Not a line to highlight, keep as is
        processedLines.push(line);
      }
    });
    
    el.innerHTML = processedLines.join('\n');
  });
}
