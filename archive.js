const beeChart = (_data, _filterFunction, _filterKey, _container) => {
    let module = {},
    arr = [],
    width = 960,
    height = 400,
    data = _data,
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
    cell,
    voro,
    brush = d3.brushX(),
    brushDirty,
    gBrush
    
    svg = container.append('svg')
        .attr('width', width)
        .attr('height', height)
    
    g = svg.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    const brushed = () => {
        if(!d3.event.selection) return;
        const selection = d3.event.selection.map(x.invert, x);
        const dots = d3.selectAll('.dot');

        dots.classed("selected", function(d) { 
            return selection[0] <= d.count_students && d.count_students <= selection[1]; 
        });
    }
    
    gBrush = g.append('g').attr('class', 'brush')
        .call(brush)

    brush
        .on("brush", brushed);

    module.init = () => {
        data.forEach(uni => {
            arr.push(uni[filterKey]);
        })

        extent = d3.extent(arr);
        
        x = d3.scaleLinear()
            .domain([extent[0], extent[1]])
            .range([0, innerWidth])

        simulation = d3.forceSimulation(data)
            .force("x", d3.forceX(d => { return x(d[filterKey]) }).strength(0.5))
            .force("y", d3.forceY(d => { return innerHeight / 2 }))
            .force("collide", d3.forceCollide(9))
            .stop();
        
        for (var i = 0; i < 120; ++i) simulation.tick();
        g.append('g')
            .attr('class', 'axis axis--x')
            .attr("transform", "translate(0," + innerHeight + ")")
            .call(d3.axisBottom(x).ticks(20, ".0s"));
        
        voro = d3.voronoi()
            .extent([[-1, -1], [width + 1 , height + 1]])
            .x((d) => { return d.x; })
            .y((d) => { return d.y; })
            .polygons(data)
        
        cell = g.append('g')
            .attr("class", "cells")

        voro.forEach( item => {
            cell.append("circle")
                .datum(item.data)
                .attr('data-students', item.data.count_students)
                .attr("class", 'dot')
                .attr("r", 3)
                .attr("cx", item.data.x)
                .attr("cy",item.data.y);
        })
    }
    return module;
}
