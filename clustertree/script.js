document.addEventListener("DOMContentLoaded", function() {
  const data_location = "/data/quotes.csv";
  const root_name = "GPT";

  d3.csv(data_location).then(function(data) {
    const quotes = data.map((d) => ({
      Category: d.Category.trim(),
      Participant: d.Participant,
      Quote: d.Quote,
      Related: d.Related ? d.Related.trim() : "",
    }));

    const graph = (() => {
      let nodesMap = {};
      let linkMap = {};
      let same = {};

      nodesMap["root"] = {
        id: "root",
        text: "Root",
        quotes: [],
      };

      for (let quote of quotes) {
        let cat = quote.Category.trim();
        let parallel_categories = [];
        const matches = [...cat.matchAll(/\[(.*?)\]/g)];
        for (const match of matches) {
          parallel_categories.push(match[1]);
          cat = cat
            .replace(new RegExp("\\[" + match[1] + "\\]", "g"), "")
            .trim();
        }

        let split = cat.split("--");
        let previous = "root";

        for (let i = 0; i < split.length; i++) {
          let newname = previous + "--" + split[i];

          if (nodesMap[newname] === undefined) {
            let text = split[i];

            nodesMap[newname] = {
              id: newname,
              text,
              quotes: [],
            };
            linkMap[newname] = [];
            if (previous !== "") {
              nodesMap[newname].parentId = previous;
            }
          }
          previous = newname;
        }
        cat = "root--" + cat;
        nodesMap[cat].quotes.push({
          participant: quote.Participant,
          text: quote.Quote,
          parallel_categories,
        });
        if (quote.Related) {
          let other = quote.Related.toLowerCase().trim();
          let type = "related";
          if (other.startsWith("::")) {
            other = other.substring(2);
            type = "same";
          }
          let res = {
            target: "root--" + other,
            type,
          };
          if (!linkMap[cat].some((e) => e.target == res.target)) {
            linkMap[cat].push(res);
          }
        }
      }

      for (let [key, value] of Object.entries(same)) {
        nodesMap[value].quotes = nodesMap[value].quotes.concat(
          nodesMap[key].quotes,
        );
        delete nodesMap[key];
        linkMap[value] = linkMap[value].concat(linkMap[key]);
        delete linkMap[key];
      }

      let nodeId = {};
      let nodes = [];
      let links = [];

      for (let [key, node] of Object.entries(nodesMap)) {
        nodeId[key] = nodes.length;
        nodes.push(node);
      }

      for (let [source, sourcelinks] of Object.entries(linkMap)) {
        for (let link of sourcelinks) {
          if (same[link.target] !== undefined) {
            link.target = same[link.target];
          }
          link.target = link.target;
          link.source = source;
          links.push(link);
        }
      }

      return {
        nodes,
        links,
      };
    })();

    const dx = 40; // Increase this value to add more vertical space between nodes
    const dy = 180;
    const margin = { top: 20, right: 120, bottom: 25, left: 40 };
    const tree = d3.tree().nodeSize([dx, dy]);

    const root = d3.stratify()(graph.nodes);
    console.log(root.data);

    const nodeMap = {};

    root.data.text = root_name;
    root.x0 = dy / 2;
    root.y0 = 0;
    root.descendants().forEach((d, i) => {
      nodeMap[d.data.id] = d;
      d.id = i;
      d._children = d.children;
    });

    const svg = d3
      .select("#chart")
      .append("svg")
      .style("font", "14px sans-serif")
      .style("user-select", "none");

    const gLink = svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5);

    const gNode = svg
      .append("g")
      .attr("cursor", "pointer")
      .attr("pointer-events", "all");

    const gArrows = svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5);

    const diagonal = d3
      .linkHorizontal()
      .x((d) => d.y)
      .y((d) => d.x);

    function update(source) {
      const duration = d3.event && d3.event.altKey ? 1500 : 150;
      const nodes = root.descendants().reverse();
      const links = root.links();
      console.log(links);

      tree(root);

      let left = root;
      let right = root;
      let bottom = root;
      root.eachBefore((node) => {
        if (node.x < left.x) left = node;
        if (node.x > right.x) right = node;
        if (node.y > bottom.y) bottom = node;
      });

      const height = right.x - left.x + margin.top + margin.bottom;
      const width = bottom.y + margin.left + margin.right + 200; // Added padding for text

      svg
        .attr("viewBox", [
          -margin.left,
          left.x - margin.top,
          width,
          height + margin.top + margin.bottom,
        ])
        .attr("height", height + margin.top + margin.bottom)
        .attr("width", width + margin.left + margin.right);

      const node = gNode.selectAll("g").data(nodes, (d) => d.id);

      const nodeEnter = node
        .enter()
        .append("g")
        .attr("transform", (d) => `translate(${source.y0},${source.x0})`)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0)
        .on("click", (event, d) => {
          d.children = d.children ? null : d._children;
          update(d);
        });

      nodeEnter
        .append("circle")
        .attr("r", 4.5)
        .attr("fill", (d) => (d._children ? "#2196f3" : "#A3A3A3")) // Reversed colors
        .attr("stroke-width", 10);

      nodeEnter
        .append("text")
        .attr("dy", "0.31em")
        .attr("x", (d) => (d._children ? -10 : 10))
        .attr("text-anchor", (d) => (d._children ? "end" : "start"))
        .text((d) => d.data.text)
        .clone(true)
        .lower()
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 3)
        .attr("stroke", "white");

      const pquotes = nodeEnter
        .append("text")
        .attr("dy", "1.31em")
        .attr("x", (d) => (d._children ? -10 : 10))
        .attr("text-anchor", (d) => (d._children ? "end" : "start"))
        .selectAll("tspan")
        .data((d) => d.data.quotes)
        .enter()
        .append("tspan")
        .text((q) => ` ${q.participant}`)
        .attr("fill", (q) =>
          q.parallel_categories.includes("bad") ? "red" : "black",
        )
        .on("click", (event, d) => {
          d3.select("#textarea").text(`${d.participant}: ${d.text}`);
          return false;
        });

      const nodeUpdate = node
        .merge(nodeEnter)
        .transition()
        .duration(duration)
        .attr("transform", (d) => `translate(${d.y},${d.x})`)
        .attr("fill-opacity", 1)
        .attr("stroke-opacity", 1);

      const nodeExit = node
        .exit()
        .transition()
        .duration(duration)
        .remove()
        .attr("transform", (d) => `translate(${source.y},${source.x})`)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0);

      const arrow = gArrows
        .selectAll("path")
        .data(
          graph.links.filter(
            (l) =>
              nodes.includes(nodeMap[l.target]) &&
              nodes.includes(nodeMap[l.source]),
          ),
        );

      const arrowEnter = arrow
        .enter()
        .append("path")
        .attr("d", (d) => {
          const o = { x: source.x0, y: source.y0 };
          return diagonal({ source: o, target: o });
        })
        .classed("arrow", true)
        .attr("cursor", "pointer")
        .on("click", (event, d) => {
          d3.select("#textarea").text(`${d.type}: ${d.source} -> ${d.target}`);
        });

      arrow
        .merge(arrowEnter)
        .transition()
        .duration(duration)
        .attr("d", (d) => {
          var x0 = nodeMap[d.source].x,
            x1 = nodeMap[d.target].x,
            y0 = nodeMap[d.source].y,
            y1 = nodeMap[d.target].y;
          return linker({ source: { x: x0, y: y0 }, target: { x: x1, y: y1 } });
        });

      arrow
        .exit()
        .transition()
        .duration(duration)
        .remove()
        .attr("d", (d) => {
          const o = { x: source.x, y: source.y };
          return diagonal({ source: o, target: o });
        });

      const link = gLink.selectAll("path").data(links, (d) => d.target.id);

      const linkEnter = link
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", (d) => {
          const o = { x: source.x0, y: source.y0 };
          return diagonal({ source: o, target: o });
        });

      link.merge(linkEnter).transition().duration(duration).attr("d", diagonal);

      link
        .exit()
        .transition()
        .duration(duration)
        .remove()
        .attr("d", (d) => {
          const o = { x: source.x, y: source.y };
          return diagonal({ source: o, target: o });
        });

      root.eachBefore((d) => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

    function linker(d) {
      const x0 = d.source.x;
      const y0 = d.source.y;
      const y1 = d.target.y;
      const x1 = d.target.x;
      const k = 10;
      const dx = x1 - x0;
      const dy = y1 - y0;
      const dr = Math.sqrt(dx * dx + dy * dy);
      const path = d3.path();
      path.moveTo(y0, x0);
      path.bezierCurveTo(y1 - k, x0, y0, x1, y1 - k, x1);
      path.lineTo(y1, x1);
      return path.toString();
    }

    update(root);
  });
});
