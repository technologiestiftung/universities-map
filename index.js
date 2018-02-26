const mapChart = function (_data, _geojson, _filterFunction, _filterKey, _container) {
    let module = {},
    data = _data,
    geojson = _geojson,
    container = _container,
    arr = [],
    extent,
    width = 500,
    height = 500,
    rangeMin = 1,
    rangeMax = 150,
    scale,
    svg = container.append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr("stroke", "#D3D3D3")
        .attr("stroke-width", "1px")
        .attr("fill", "none"),
    proj = d3.geoMercator()
        .scale(2000)
        .center([11.42, 50.91])
        .translate([width / 2, height / 2]),
    path = d3.geoPath()
        .projection(proj)
    svg.append("path").attr('d', path(topojson.mesh(geojson)))

    module.init = () => {
        data.forEach( item => {
            arr.push(item.count_students);
        })

        extent = d3.extent(arr);
        scale = d3.scaleLinear()
            .domain([extent[0], extent[1]])
            .range([rangeMin, rangeMax]);
        
        svg.selectAll('line')
            .data(data)
            .enter()
            .append('line')
            .attr("x1", d => { 
                if(d.count_students) {
                    const  lnglat = proj([d.lng, d.lat]);
                    return lnglat[0]
                } else { return "1px" }
            })
            .attr("y1", d => { 
                if(d.count_students) {
                    const  lnglat = proj([d.lng, d.lat]);
                    return lnglat[1]
                }
            })
            .attr("x2", d => { 
                if(d.count_students) {
                    const  lnglat = proj([d.lng, d.lat]);
                    return lnglat[0]
                }
            })
            .attr("y2", d => { 
                if(d.count_students) {
                    const  lnglat = proj([d.lng, d.lat]);
                    return lnglat[1] - scale(d.count_students);
                } else {
                    return "1px"
                }
            })
            .attr("stroke", "red")
            .attr("stroke-width", "1px")
    }
    return module;
}

const beeChart = (_data, _filterFunction, _filterKey, _container) => {
    let module = {},
    arr = [],
    width = 960,
    data = _data,
    height = 400,
    margin = { top: 40, right: 40, bottom: 40, left: 40 },
    innerHeight = height - margin.top - margin.bottom,
    innerWidth = width - margin.left - margin.right,
    filterKey = _filterKey,
    x,
    g,
    container = _container,
    svg,
    extent,
    simulation,
    cell

    svg = container.append('svg')
        .attr('width', width)
        .attr('height', height)

    g = svg.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    
    module.init = () => {
        data.forEach(uni => {
            uni = type(uni);
            arr.push(uni[filterKey]);
        })

        extent = d3.extent(arr);
        
        x = d3.scaleLinear()
            .domain([extent[0], extent[1]])
            .range([0, innerWidth])

        simulation = d3.forceSimulation(data)
            .force("x", d3.forceX(d => { return x(d[filterKey]) }).strength(0.5))
            .force("y", d3.forceY(d => { return innerHeight / 2 }))
            .force("collide", d3.forceCollide(4))
            .stop();
        
        for (var i = 0; i < 120; ++i) simulation.tick();
        g.append('g')
            .attr('class', 'axis axis--x')
            .attr("transform", "translate(0," + innerHeight + ")")
            .call(d3.axisBottom(x).ticks(20, ".0s"));
        
        cell = g.append('g')
            .attr('class', 'cells')
            .selectAll('g').data(d3.voronoi()
                .extent([[-1, -1], [width + 1 , height + 1]])
                .x((d) => { return d.x; })
                .y((d) => { return d.y; })
            .polygons(data)).enter().append("g");
        
        cell.append("circle")
            .attr("r", 3)
            .attr("cx", function(d) { 
                if(d != undefined) {
                    return d.data.x;
                }
                })
            .attr("cy", function(d) {
                if(d != undefined) {

                    return d.data.y; 
                }
            });
            
        
    }
    return module;
}

function type(d) {
    if (!d.count_students) return;
    d.count_students = +d.count_students;
    return d;
  }

d3.queue()
    .defer(d3.json, "./data/unis.json")
    .defer(d3.json, "./data/germany.json")
    .await( (error, unis, counties) => {
        const map_chart = mapChart(unis, counties, '', 'count_students', d3.select('#mapChart'));
        map_chart.init();

        const bee_chart = beeChart(unis, '', 'count_students', d3.select('#beeChart'));
        bee_chart.init();
    })



    // function updateCharts() {
    //     // set new data into current charts
    //     const map_chart = mapChart(unis, counties, '', d3.select('#mapChart'))
    // }
    



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


// })
