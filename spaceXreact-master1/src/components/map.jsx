import * as d3 from "d3";
import Geo from "../geo.json";
import { useRef, useEffect } from "react";

const width = 1000;
const height = 600;
const margin = { top: 20, right: 20, bottom: 20, left: 100 };
const projection = d3.geoMercator()
    .scale(70)
    .center([0, 20])
    .translate([width / 2, height / 2]);

function Map({ launchpads, activeLaunchpadId }) {
    const containerRef = useRef(null);

    useEffect(() => {
        const svg = d3.select(containerRef.current).append("svg");
        svg.attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .attr("preserveAspectRatio", "xMinYMin meet");

        const mapLayer = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        mapLayer.selectAll("path")
            .data(Geo.features)
            .enter()
            .append("path")
            .attr("class", "topo")
            .attr("d", d3.geoPath().projection(projection))
            .style("opacity", .7)

        mapLayer.append("g").attr("class", "launchpads");
        const zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on('zoom', function (event) {
                mapLayer.attr('transform', `translate(${margin.left},${margin.top}) ${event.transform}`);
            });

        svg.call(zoom);

        return () => svg.remove();
    }, []);

    useEffect(() => {
        const validLaunchpads = launchpads
            .map(launchpad => ({
                ...launchpad,
                latitude: launchpad.latitude == null || launchpad.latitude === ""
                    ? NaN
                    : Number(launchpad.latitude),
                longitude: launchpad.longitude == null || launchpad.longitude === ""
                    ? NaN
                    : Number(launchpad.longitude),
            }))
            .filter(launchpad =>
                Number.isFinite(launchpad.latitude) &&
                Number.isFinite(launchpad.longitude)
            );
        const circles = d3.select(containerRef.current)
            .select(".launchpads")
            .selectAll("circle")
            .data(validLaunchpads, launchpad => String(launchpad.id));

        circles.exit().remove();
        const enteredCircles = circles.enter()
            .append("circle")
            .attr("class", "launchpad-dot");
        enteredCircles.append("title");

        const mergedCircles = enteredCircles.merge(circles);
        mergedCircles
            .attr("cx", launchpad => projection([launchpad.longitude, launchpad.latitude])[0])
            .attr("cy", launchpad => projection([launchpad.longitude, launchpad.latitude])[1])
            .attr("r", launchpad => String(launchpad.id) === String(activeLaunchpadId) ? 10 : 6)
            .classed("launchpad--highlighted", launchpad => String(launchpad.id) === String(activeLaunchpadId))
            .attr("aria-label", launchpad => launchpad.name ?? "Launchpad")
            .select("title")
            .text(launchpad => launchpad.name ?? "Launchpad");

        mergedCircles.filter(launchpad =>
            String(launchpad.id) === String(activeLaunchpadId)
        ).raise();
    }, [launchpads, activeLaunchpadId]);

    return (
        <div className="mapContainer" id="map" ref={containerRef} />
    )
}

export { Map }
