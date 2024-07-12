# Qualitative Analysis Cluster Tree

D3 cluster trees for qualitative analysis

Code for cluster trees stolen from Dr. João Pimentel, updated with content from [D3](https://observablehq.com/@d3/tree/2?intent=fork), then modified.

## Instructions

### Quote format

- Quotes are digested from CSV files that have the headings `Participant, Category, Related, Quote`

- `Category` items create nodes, `Related` items create links between nodes

- The cluster tree creates its hierarchy using double dashes. Categories should appear in the CSV like `top--middle--bottom`, with n number of middle categories

### Running the graphing tool

To use:

1. open `script.js` and change the path to the quotes you want to use
1. run `index.html` with `python -m http.server`

Blue nodes are not leaves, meaning they can be expanded and collapsed

#### Gotchas

1. running with `python -m http.server` will make the root of the HTTP server whatever directory you run it from. If your quote data is in another directory above the directory you run the server from, the graphing script will not be able to find it. The suggested solution is to run the server from the root and give the graphing script the path to your quote data from the repo root.. When you do this, the directory structure will appear on the webpage for the localhost port the server is running on. Click `vanilla` to get to the graph.
