
if (typeof patternMap === 'undefined') {
  var patternMap = {};
}

var my_pattern = null;
  Reveal.addEventListener('slidechanged', function(event) {
    highlightLinesWithPatterns(event.currentSlide, patternMap);    
  });

  function highlightLinesWithDecorator(slide, pattern) {
  slide.querySelectorAll('.src').forEach(el => {
    const originalLines = el.innerHTML.split('\n');
    const processedLines = [];

    originalLines.forEach(line => {
      // Check if line contains pattern
      if (line.includes(pattern) && !line.includes('highlight-line')) {
        // Find the position of the first span tag
        const firstSpanIndex = line.indexOf('<span');
        
        if (firstSpanIndex !== -1) {
          // Split the line at the first span tag
          const beforeSpan = line.substring(0, firstSpanIndex);
          const fromSpan = line.substring(firstSpanIndex);
          
          // Wrap only from the first span tag to the end
          processedLines.push(
            `${beforeSpan}<span class="highlight-line" style="display: inline-block; width: 100%">${fromSpan}</span>`
          );
        } else {
          // If no span tag found, just add the line as is
          processedLines.push(line);
        }
      } else {
        processedLines.push(line);
      }
    });

    el.innerHTML = processedLines.join('\n');
  });
}



function highlightLinesWithPatterns(slide, patternMap) {
  // patternMap is a dictionary like {section_id_1: 'pattern_1', section_id_2: 'pattern_2', ...}
  console.log('checking');
  const startSpan = '<span class="highlight-line" style="display: inline-block; width: 100%">';
  slide.querySelectorAll('.src').forEach(el => {
    // Find the parent section element to get its ID
    let parentSection = el.closest('section');
    let sectionId = parentSection ? parentSection.id : null;
    console.log(`checking section ${sectionId}`)
    // Determine which pattern to use based on section ID
    let patternToUse = sectionId && patternMap[sectionId] 
                      ? patternMap[sectionId] 
                      : null;
    
    // Skip if no matching pattern found for this section
    if (!patternToUse) return;
    
    const originalLines = el.innerHTML.split('\n');
    const processedLines = [];

    originalLines.forEach(line => {
      // Check if line contains the pattern for this section
      if (line.includes(patternToUse) && !line.includes('highlight-line')) {
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
          // If no span tag found, just add the line as is
          processedLines.push(line);
        }
      } else {
        processedLines.push(line);
      }
    });

    el.innerHTML = processedLines.join('\n');
  });
}
