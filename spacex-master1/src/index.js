import { SpaceX } from "./api/spacex.js";
import * as d3 from "d3";
import * as Geo from "./geo.json";

document.addEventListener("DOMContentLoaded", setup);

function setup() {
  const spaceX = new SpaceX();
  spaceX.launches().then((data) => {
    // 1. Рисуем карту и получаем доступ к svg и projection
    const mapElements = drawMap();

    // 2. Рисуем список
    const listContainer = document.getElementById("listContainer");
    renderLaunches(data, listContainer);

    // 3. Рисуем точки на карте и настраиваем hover
    drawLaunchpads(data, mapElements.svg, mapElements.projection);
  });
}

function renderLaunches(launches, container) {
  const list = document.createElement("ul");
  list.className = "launch-list";

  launches.forEach((launch) => {
    const item = document.createElement("li");
    item.className = "launch-item";
    // Сохраняем ID площадки в data-атрибут для связи с картой
    if (launch.pad) {
      item.setAttribute("data-pad-id", launch.pad.id);
    }
    item.innerHTML = `<strong>${launch.name}</strong><br><small>${launch.pad ? launch.pad.name : "Unknown pad"}</small>`;
    list.appendChild(item);
  });
  container.replaceChildren(list);
}

function drawMap() {
  const width = 640;
  const height = 480;
  const margin = { top: 20, right: 10, bottom: 40, left: 100 };

  // Очищаем контейнер перед отрисовкой (на случай перезагрузки)
  d3.select("#map").html("");

  const svg = d3
    .select("#map")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  const projection = d3
    .geoMercator()
    .scale(70)
    .center([0, 20])
    .translate([width / 2 - margin.left, height / 2]);

  svg
    .append("g")
    .selectAll("path")
    .data(Geo.features)
    .enter()
    .append("path")
    .attr("class", "topo")
    .attr("d", d3.geoPath().projection(projection))
    .attr("fill", "#ccc") // Заменил colorScale(0) на серый, так как функции colorScale у тебя нет в файле
    .style("opacity", 0.7);

  // Возвращаем переменные, чтобы использовать их дальше
  return { svg, projection };
}

function drawLaunchpads(launches, svg, projection) {
  // Собираем уникальные площадки (чтобы не рисовать одну и ту же точку 10 раз)
  const padsMap = new Map();
  launches.forEach((launch) => {
    const pad = launch.pad;
    // Добавляем только если есть координаты
    if (pad && pad.latitude && pad.longitude) {
      padsMap.set(pad.id, pad);
    }
  });
  const uniquePads = Array.from(padsMap.values());

  // Рисуем кружочки. ВАЖНО: projection принимает [longitude, latitude]!
  const dots = svg
    .selectAll(".launchpad-dot")
    .data(uniquePads, (d) => d.id)
    .join("circle")
    .attr("class", "launchpad-dot")
    .attr("data-pad-id", (d) => d.id)
    .attr("cx", (d) => projection([d.longitude, d.latitude])[0])
    .attr("cy", (d) => projection([d.longitude, d.latitude])[1])
    .attr("r", 4)
    .attr("fill", "#e74c3c")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1);

  // --- ЛОГИКА HOVER ---
  const items = document.querySelectorAll(".launch-item");

  items.forEach((item) => {
    item.addEventListener("mouseenter", () => {
      const padId = item.getAttribute("data-pad-id");
      if (!padId) return;

      // Тускнеем все точки
      dots.attr("opacity", 0.2);

      // Подсвечиваем только нужную
      dots
        .filter((d) => String(d.id) === String(padId))
        .attr("opacity", 1)
        .attr("r", 8)
        .attr("fill", "#f39c12");
    });

    item.addEventListener("mouseleave", () => {
      // Возвращаем как было
      dots.attr("opacity", 1).attr("r", 4).attr("fill", "#e74c3c");
    });
  });
}
