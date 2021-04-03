(function() {
   let template = document.createElement("template");
   template.innerHTML = `
      <link rel="stylesheet" href="https://js.arcgis.com/4.17/esri/themes/light/main.css">
      <style>
          #mapview {
              width: 100%;
              height: 100%;
          }

      </style>
      <div id='mapview'></div>
   `;
 
    class Map extends HTMLElement {
      constructor() {
          super();
          //this._shadowRoot = this.attachShadow({mode: "open"});
          this.appendChild(template.content.cloneNode(true));
          this._props = {};
          let that = this;
 
          require([
      		    "esri/config",
				      "esri/WebMap",
				      "esri/views/MapView",
				      "esri/widgets/BasemapToggle",
				      "esri/layers/FeatureLayer",
				      "esri/widgets/TimeSlider",
				      "esri/widgets/Expand",
				      "esri/tasks/RouteTask",
				      "esri/tasks/support/RouteParameters",
				      "esri/tasks/support/FeatureSet",
				      "esri/Graphic",
				      "esri/views/ui/UI",
				      "esri/views/ui/DefaultUI"
          ], function(esriConfig, WebMap, MapView, BasemapToggle, FeatureLayer, TimeSlider, Expand, RouteTask, RouteParameters, FeatureSet, Graphic) {
  		    		// set portal and API Key
		        	esriConfig.portalUrl = "https://arcgisent.gcoe.cloud/portal";
		      		esriConfig.apiKey = 'WU-6RmVTw6-fZB6LRO-J8w0smNPCpbBnIweq70bupv0RhGVcncRkTVFLivcv1UXIfpyLkIFPz13wA7AKjDo7T8AgCdDNTpXUWBAuscdfnjlTxmOgMDfqi18uaV75cuCzAMktu0aalDfJFkPXkV4usJwS8ioYXPjwClsr6_KrTcp-7A5mziw_0AYAN488u1FJi1tdIcs6BCM64C8Er4R4as6VkEju_5AeukwfsPs0iJs.';
		
		      		const webmap = new WebMap ({
		                portalItem: {
				      		id: "137c11ce25bc485ca31feaf548f563f3"
		    			}
				    });

				    const view = new MapView({
		  			    container: "mapview",
		  			    map: webmap
				    });

                    // find the guarantee of service layer 
                    const foundLayer = map.allLayers.find(function(layer) {
                        console.log( layer.title); 
                        return layer.title === "SPL";
                    });
    
              view.when(function () {
                  view.popup.autoOpenEnabled = false; //disable popups

                  // Create the basemap toggle
          				var basemapToggle = new BasemapToggle({
            		  		view:view,
            		  		nextBasemap: "satellite"
          				});
                  
                  // Add the toggle to the bottom-right of the view
			          	view.ui.add( basemapToggle, "bottom-right");

//           				// time slider widget initialization
//          				const timeSlider = new TimeSlider({
//          		  			container: "timeSlider",
//          		  			view: view
//          				});
		
          				var routeTask = new RouteTask({
          		  			url: "https://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World"
          				});  
  
//          				view.on("click", function( event) {
//                      if (view.graphics.length === 0) {
//                          addGraphic("start", event.mapPoint);
//                      } else if (view.graphics.length === 1) {
//                          addGraphic("finish", event.mapPoint);
//                          getRoute();
//                      } else {
//                          view.graphics.removeAll();
//                          addGraphic("start", event.mapPoint);
//                      }
//          				});
  
                  function addGraphic(type, point) {
                      var graphic = new Graphic({
                          symbol: {
                              type: "simple-marker",
                              color: type === "start" ? "white" : "black",
                              size: "8px"
                          },
                          geometry: point
                      });
                      view.graphics.add(graphic);
                  }
  
                  function getRoute() {
                      // Setup the route parameters
                      var routeParams = new RouteParameters({
                          stops: new FeatureSet({
                              features: view.graphics.toArray() // Pass the array of graphics
                          }),
                          returnDirections: true
                      });
            
                      // Get the route
                      routeTask.solve(routeParams).then(function (data) {

                          // Display the route
                          data.routeResults.forEach(function (result) {
                              result.route.symbol = {
                              type: "simple-line",
                              color: [5, 150, 255],
                              width: 3
                              };
                              view.graphics.add(result.route);
                          });
                  
                          // Display the directions
                          var directions = document.createElement("ol");
                          directions.classList = "esri-widget esri-widget--panel esri-directions__scroller";
                          directions.style.marginTop = 0;
                          directions.style.paddingTop = "15px";
                
                          // Show the directions
                          var features = data.routeResults[0].directions.features;
                              features.forEach(function (result, i) {
                              var direction = document.createElement("li");
                              direction.innerHTML =
                              result.attributes.text + " (" + result.attributes.length.toFixed(2) + " miles)";
                              directions.appendChild(direction);
                          });
                
                          // Add directions to the view
                          view.ui.empty("top-right");
                          view.ui.add(directions, "top-right");
                      });
                  }
              });
          });
    
      }
 
      getSelection() {
          return this._currentSelection;
      }
 
      async setDataSource(source) {
          this._dataSource = source;
          let googleResult = await fetch("https://app.boshdbserver.hanademo.cloud/sap/sw/majorincidents.json");
          let results = await googleResult.json();
          console.log(results);
 
          let resultSet = await source.getResultSet();
          const that = this;
          this._spatialLayer.queryFeatures().then(function(mapFeatures){
              const features = mapFeatures.features;

              const edits = {
                  updateFeatures: []
              }
 
              const loc_id = that._props["locId"] || "";
 
              let max = 0;
              for(let feature of features) {
                  let result = resultSet.find((result) => feature.attributes[loc_id] == result[loc_id].id);
                  let value = result ? parseFloat(result["@MeasureDimension"].rawValue) : null;
 
                  feature.attributes["Measure"] = value;
                  max = value > max ? value : max;
 
                  edits.updateFeatures.push(feature);
              }
 
              edits.updateFeatures.forEach((feature) => feature.attributes["Max"] = max);
 
              that._spatialLayer.applyEdits(edits)
              .then((editResults) => {
                   console.log(editResults);
              })
              .catch((error) => {
                  console.log("===============================================");
                  console.error(
                      "[ applyEdits ] FAILURE: ",
                      error.code,
                      error.name,
                      error.message
                  );
                  console.log("error = ", error);
              })
          });                                   
      }
 
      onCustomWidgetBeforeUpdate(changedProperties) {
             this._props = { ...this._props, ...changedProperties };
      }
          onCustomWidgetAfterUpdate(changedProperties) {
      }
    }
 
    let scriptSrc = "https://js.arcgis.com/4.18/"
    let onScriptLoaded = function() {
        customElements.define("com-sap-custom-geomap", Map);
    }
 
    //SHARED FUNCTION: reuse between widgets
    //function(src, callback) {
    let customElementScripts = window.sessionStorage.getItem("customElementScripts") || [];
 
    let scriptStatus = customElementScripts.find(function(element) {
        return element.src == scriptSrc;
    });
 
    if (scriptStatus) {
        if(scriptStatus.status == "ready") {
            onScriptLoaded();
        } else {
            scriptStatus.callbacks.push(onScriptLoaded);
        }
    } else {
        let scriptObject = {
          "src": scriptSrc,
          "status": "loading",
          "callbacks": [onScriptLoaded]
        }
 
        customElementScripts.push(scriptObject);
 
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = scriptSrc;
        script.onload = function(){
            scriptObject.status = "ready";
            scriptObject.callbacks.forEach((callbackFn) => callbackFn.call());
        };
        document.head.appendChild(script);
    }
    //}
    //END SHARED FUNCTION
})();