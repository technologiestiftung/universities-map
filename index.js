const json = './data/germany.json';
const unis = './data/unis_geo.json';
let extent;

d3.json(unis, (err, data) => {
    let unis_count = [];
    data.forEach( (uni, i) => {
        if (uni.steckbrief.Studierendenzahl != undefined) {
            const student_count = parseInt(uni.steckbrief.Studierendenzahl.replace(" (WS 2016/2017)", ""));
            unis_count.push(student_count);
        }
    })

    extent = d3.extent(unis_count);
    let scale = d3.scaleLinear()
        .domain([extent[0], extent[1]])
        .range([1, 150]);

        const width = 500, 
        height = 500
  
    const proj = d3.geoMercator()
        .scale(2000)
        .center([11.42, 50.91])
        .translate([width / 2, height / 2])
    
    const path = d3.geoPath()
        .projection(proj)
    
    const svg = d3.select("body")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("stroke", "#D3D3D3")
        .attr("stroke-width", "1px")
        .attr("fill", "none")
    
    d3.json(json, (err,data) => {
        svg.append("path").attr('d', path(topojson.mesh(data)))
    })

    d3.json(unis, (err,data) => {
        svg.selectAll('line')
            .data(data)
            .enter()
            .append('line')
            .attr("x1", d => { 
                if(d.steckbrief.Studierendenzahl) {
                    const  lnglat = proj([d.anschrift.lng, d.anschrift.lat]);
                    return lnglat[0]
                } else { return "1px" }
            })
            .attr("y1", d => { 
                if(d.steckbrief.Studierendenzahl) {
                    const  lnglat = proj([d.anschrift.lng, d.anschrift.lat]);
                    return lnglat[1]
                }
            })
            .attr("x2", d => { 
                if(d.steckbrief.Studierendenzahl) {
                    const  lnglat = proj([d.anschrift.lng, d.anschrift.lat]);
                    return lnglat[0]
                }
            })
            .attr("y2", d => { 
                if(d.steckbrief.Studierendenzahl) {
                    const  lnglat = proj([d.anschrift.lng, d.anschrift.lat]);
                    return lnglat[1] - scale(parseInt(d.steckbrief.Studierendenzahl.replace(" (WS 2016/2017)", "")));
                } else {
                    return "1px"
                }
            })
            .attr("stroke", "red")
            .attr("stroke-width", "1px")
    })
    
    // d3.json(unis, (err,data) => {
    //     svg.selectAll("circle")
    //         .data(data)
    //         .enter()
    //         .append("circle")
    //         .attr("cx", d => { 
    //             const  lnglat = proj([d.anschrift.lng, d.anschrift.lat]);
    //             return lnglat[0]
    //         })
    //         .attr("cy", d => { 
    //             const  lnglat = proj([d.anschrift.lng, d.anschrift.lat]);
    //             return lnglat[1]
    //         })
    //         .attr("r", d => { 
    //             if(d.steckbrief.Studierendenzahl) { return scale(parseInt(d.steckbrief.Studierendenzahl.replace(" (WS 2016/2017)", ""))) } else 
    //             { return "1px"; }
    //         })
    //         .attr("fill", "none")
    //         .attr('opacity', 0.5)
    //         .attr("stroke", "1px")
    //         .on("mouseover", (d) => {
    //             const name = d.name;
    //             const anzahl = parseInt(d.steckbrief.Studierendenzahl.replace(" (WS 2016/2017)", ""));
    //             return document.getElementById('name').innerHTML=name;
    //         })
    // })


})








