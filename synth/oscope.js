export const OScope = function(context, elem) {
    const analyser = context.createAnalyser();
    const elem = document.getElementById(elem);
    
    analyser.width = elem.offsetWidth;
    analyser.height = elem.offsetHeight;
    analyser.lineColor = 'white';
    analyser.lineThickness = 1;

    const svgNamespace = 'http://www.w3.org/2000/svg';
    const paper = document.createElementNS(svgNamespace, 'svg');
    paper.setAttribute('width', analyser.width);
    paper.setAttribute('height', analyser.height);
    paper.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink', 'http://www.w3.org/1999/xlink');
    elem.appendChild(paper); 

    const oscLine = document.createElementNS(svgNamespace, 'path');
    oscLine.setAttribute('stroke', analyser.lineColor);
    oscLine.setAttribute('stroke-width', analyser.lineThickness);
    oscLine.setAttribute('fill', 'none');
    paper.appendChild(oscLine);

    const noDataPoints = 10,
        freqData = new Uint8Array(analyser.frequencyBinCount);


    const drawLine = function() {
        analyser.getByteTimeDomainData(freqData);

        const graphPoints = [],
            graphStr = '';

        graphPoints.push('M0, ' + (analyser.height / 2));

        for (const i = 0; i < freqData.length; i++) {
            if (i % noDataPoints) {
                const point = (freqData[i] / 128) * (analyser.height / 2);
                graphPoints.push('L' + i + ', ' + point); 
            }
        }

        // freqData.forEach(item => {
        //     if (item % noDataPoints) {
        //         const point = (freqData[item] / 128) * (analyser.height / 2);
        //         graphPoints.push('L' + item + ', ' + point); 
        //     }
        // });

        for (i = 0; i < graphPoints.length; i++) {
            graphStr += graphPoints[i];
        }

        oscLine.setAttribute('stroke', analyser.lineColor);
        oscLine.setAttribute('stroke-width', analyser.lineThickness);

        oscLine.setAttribute('d', graphStr);

        setTimeout(drawLine, 100);
    };

    drawLine();

    return analyser;
};
