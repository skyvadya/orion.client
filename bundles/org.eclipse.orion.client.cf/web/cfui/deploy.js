/*global parent window document define orion setTimeout*/
	
var uiTestFunc = null;

define(["orion/bootstrap", "orion/xhr", 'orion/webui/littlelib', 'orion/Deferred', 'orion/cfui/cFClient', 'orion/PageUtil', 'orion/selection', 'orion/explorers/explorer',
	'orion/URITemplate', 'orion/PageLinks', 'orion/preferences'], 
		function(mBootstrap, xhr, lib, Deferred, CFClient, PageUtil, mSelection, mExplorer, URITemplate, PageLinks, Preferences) {

	mBootstrap.startup().then(
		function(core) {
			
			var pageParams = PageUtil.matchResourceParameters();
			var deployResource = decodeURIComponent(pageParams.resource);
			
			var serviceRegistry = core.serviceRegistry;
//			var preferences = core.preferences;
			var cFService = new CFClient.CFService(serviceRegistry);
			
			// initial message
			document.getElementById('title').appendChild(document.createTextNode("Choose Space To Deploy")); //$NON-NLS-1$//$NON-NLS-0$
			var progressPane = document.getElementById('progressPane'); //$NON-NLS-0$
			var msgLabel = document.getElementById('messageLabel'); //$NON-NLS-0$
			var msgNode;
			var orgsTree = document.getElementById('orgsTree'); //$NON-NLS-0$
			var okButton = document.getElementById('okbutton'); //$NON-NLS-0$
			var explorer;
			
			function showMessage(message){
				msgNode = msgLabel.appendChild(document.createTextNode(message)); //$NON-NLS-0$
				progressPane.classList.add("running");
			}
			
			function hideMessage(){
				if(msgNode){
					msgLabel.removeChild(msgNode);
				}
				progressPane.classList.remove("running");
			}
			
			showMessage("Getting spaces...");
			
			var selection;
			
			// register hacked pref service
			
			var temp = document.createElement('a');
			temp.href = "../prefs/user";
			var location = temp.href;
			
			function PreferencesProvider(location) {
				this.location = location;
			}

			PreferencesProvider.prototype = {
				get: function(name) {
					return xhr("GET", this.location + name, {
						headers: {
							"Orion-Version": "1"
						},
						timeout: 15000,
						log: false
					}).then(function(result) {
						return result.response ? JSON.parse(result.response) : null;
					});
				},
				put: function(name, data) {
					return xhr("PUT", this.location + name, {
						data: JSON.stringify(data),
						headers: {
							"Orion-Version": "1"
						},
						contentType: "application/json;charset=UTF-8",
						timeout: 15000
					}).then(function(result) {
						return result.response ? JSON.parse(result.response) : null;
					});
				},
				remove: function(name, key){
					return xhr("DELETE", this.location + name +"?key=" + key, {
						headers: {
							"Orion-Version": "1"
						},
						contentType: "application/json;charset=UTF-8",
						timeout: 15000
					}).then(function(result) {
						return result.response ? JSON.parse(result.response) : null;
					});
				}
			};
			
			var service = new PreferencesProvider(location);
			serviceRegistry.registerService("orion.core.preference.provider", service, {});
			
			// This is code to ensure the first visit to orion works
			// we read settings and wait for the plugin registry to fully startup before continuing
			var preferences = new Preferences.PreferencesService(serviceRegistry);
			
			// cancel button
			var closeFrame = function() {
				 window.parent.postMessage(JSON.stringify({pageService: "orion.page.delegatedUI", 
					 source: "org.eclipse.orion.client.cf.deploy.uritemplate", cancelled: true}), "*");
			};
			
			var doAction = function() {
				showMessage("Deploying...");
				
				selection.getSelection(
					function(selection) {
						if(selection===null || selection.length===0){
							closeFrame();
							return;
						}
						
						explorer.getNavHandler().setSelectionPolicy("readonlySelection");
						
						var deployResourceJSON = JSON.parse(deployResource);
						
						cFService.pushApp(selection, null, decodeURIComponent(deployResourceJSON.ContentLocation + deployResourceJSON.AppPath)).then(
							function(result){
								postMsg({
									CheckState: true,
									ToSave: {
										ConfigurationName: result.App.entity.name + " on " + result.Target.Space.Name + " / " + result.Target.Org.Name,
										Parameters: {
											Target: {
												Url: result.Target.Url,
												Org: result.Target.Org.Name,
												Space: result.Target.Space.Name
											},
											Name: result.App.entity.name
										},
										Url: "http://" + result.Route.entity.host + "." + result.Domain,
										UrlTitle: result.App.entity.name,
										Type: "Cloud Foundry",
										ManageUrl: result.ManageUrl,
										Path: deployResourceJSON.AppPath
									}
								});
							}, function(error){
//								if (error.HttpCode === 404){
//									postError({
//										State: "NOT_DEPLOYED",
//										Message: error.Message
//									});
//								} else if (error.JsonData && error.JsonData.error_code) {
//									var err = error.JsonData;
//									if (err.error_code === "CF-InvalidAuthToken"){
//										error.Retry = {
//											parameters: [{id: "user", type: "text", name: "User:"}, {id: "password", type: "password", name: "Password:"}]
//										};
//									} else if (err.error_code === "CF-TargetNotSet"){
//										var cloudSettingsPageUrl = new URITemplate("{+OrionHome}/settings/settings.html#,category=Cloud").expand({OrionHome : PageLinks.getOrionHome()});
//										error.Message = "Set up your Cloud. Go to [Settings](" + cloudSettingsPageUrl + ")."; 
//									}
//									postError(error);
//								} else {
									postError(error);
//								}
							}
						);
					}
				);
			};
			
			var validate = function() {
				selection.getSelection(function(selection) {
					if(selection===null || selection.length===0){
						okButton.classList.add("disabled");
						okButton.disabled = true;
						return;
					}
					okButton.classList.remove("disabled");
					okButton.disabled = false;
				});
			};

			document.getElementById('okbutton').onclick = doAction;
			document.getElementById('closeDialog').onclick = closeFrame;
			 
			// allow frame to be dragged by title bar
			var that=this;
			var iframe = window.frameElement;
		    setTimeout(function() {
				var titleBar = document.getElementById('titleBar');
				titleBar.addEventListener('mousedown', function(e) {
					that._dragging=true;
					if (titleBar.setCapture) {
						titleBar.setCapture();
					}
					that.start = {screenX: e.screenX,screenY: e.screenY};
				});
				titleBar.addEventListener('mousemove', function(e) {
					if (that._dragging) {
						var dx = e.screenX - that.start.screenX;
						var dy = e.screenY - that.start.screenY;
						that.start.screenX = e.screenX;
						that.start.screenY = e.screenY;
						var x = parseInt(iframe.style.left) + dx;
						var y = parseInt(iframe.style.top) + dy;
						iframe.style.left = x+"px";
						iframe.style.top = y+"px";
					}
				});
				titleBar.addEventListener('mouseup', function(e) {
					that._dragging=false;
					if (titleBar.releaseCapture) {
						titleBar.releaseCapture();
					}
				});
		    });

		    //
			var configAdmin = serviceRegistry.getService('orion.cm.configadmin'); //$NON-NLS-0$
			configAdmin.getConfiguration("app.settings").then(
				function(config) {
					 // get target and app, then do push and open application
					getTarget(cFService, config, preferences).then(
						function(target){
							cFService.getOrgs(target).then(
								function(result2){
									hideMessage();
									
									var targets = [];
									result2.Orgs.forEach(function(org){
										if (org.Spaces)
											org.Spaces.forEach(function(space){
												var newTarget = {};
												newTarget.Url = target.Url;
												newTarget.Org = org.Name;
												newTarget.Space = space.Name;
												targets.push(newTarget);
											});
									});
									
									selection = new mSelection.Selection(serviceRegistry, "orion.Spaces.selection"); //$NON-NLS-0$
									selection.addEventListener("selectionChanged", validate);

									explorer = new mExplorer.Explorer(
										serviceRegistry,
										selection,
										new SpacesRenderer({checkbox: false, singleSelection: true, treeTableClass: "Spaces"}));
									var model = new mExplorer.ExplorerFlatModel(null, null, targets);
									model.getId = function(item){
										return item.Space + item.Org;
									};
									orgsTree.classList.add("sectionTable");
									explorer.createTree(orgsTree.id, model, {});
								}, function(error){
									postError(error);
								}
							);
						}, function(error){
							postError(error);
						}
					);
				}
			);
		}
	);
	
	// make sure target is set and it matches the url in settings
	function getTarget(cFService, config, preferences) {
		var deferred = new Deferred();
		
		preferences.getPreferences('/cm/configurations').then(
			function(settings){
				var cloud = settings.get("org.eclipse.orion.client.cf.settings");
				if (cloud && cloud.targetUrl){
					var target = {};
					target.Url = cloud.targetUrl;
					if (cloud.manageUrl)
						target.ManageUrl = cloud.manageUrl;
					if (cloud.org)
						target.Org = cloud.org;
					if (cloud.space)
						target.Space = cloud.space;
					deferred.resolve(target);
					return;
				}
				
				preferences.getPreferences('/settingsCF', 1).then(
					function(settings){
						var cloud = settings;
						if (cloud && cloud.get("targetUrl")){
							var target = {};
							target.Url = cloud.get("targetUrl");
							if (cloud.get("manageUrl"))
								target.ManageUrl = cloud.get("manageUrl");
							deferred.resolve(target);
							return;
						} else {
//							deferred.resolve(null);
							var error = {};
							var cloudSettingsPageUrl = new URITemplate("{+OrionHome}/settings/settings.html#,category=Cloud").expand({OrionHome : PageLinks.getOrionHome()});
							error.Message = "Set up your Cloud. Go to [Settings](" + cloudSettingsPageUrl + ")."; 
							error.Severity = "Warning";
							deferred.reject(error);
						}
					}, function(error){
						var cloudSettingsPageUrl = new URITemplate("{+OrionHome}/settings/settings.html#,category=Cloud").expand({OrionHome : PageLinks.getOrionHome()});
						error.Message = "Set up your Cloud. Go to [Settings](" + cloudSettingsPageUrl + ")."; 
						error.Severity = "Warning";
						deferred.reject(error);
//						deferred.resolve(null);
					}
				);
			}, function(error){
				var cloudSettingsPageUrl = new URITemplate("{+OrionHome}/settings/settings.html#,category=Cloud").expand({OrionHome : PageLinks.getOrionHome()});
				error.Message = "Set up your Cloud. Go to [Settings](" + cloudSettingsPageUrl + ")."; 
				error.Severity = "Warning";
				deferred.reject(error);
//				deferred.resolve(null);
			}
		);
		return deferred;
		
		
//		var deferred = new Deferred();
//		
//		preferences.getPreferences('/settingsCF').then(
//			function(settings){
//				var props = config.getProperties() || {};
//				var cfgTarget = props["app.target"] || ""; //$NON-NLS-0$
//				var cfgValid = (typeof cfgTarget === 'string' && cfgTarget.length > 0);
//
//				var defaultTarget = settings.get("targetUrl");
//				if (!cfgValid){
//					props["app.target"] = defaultTarget;
//					props["app.manage.url"] = settings.get("manageUrl");
//					config.update(props);
//				}
//				
//				cFService.getTarget().then(function(result) {
//					var cFTarget = result.Url;
//					var cFValid = (typeof cFTarget === 'string' && cFTarget.length > 0);
//					// if cf target is invalid, prompt for target
//					if (!cFValid) {
//						if (defaultTarget) {
//							cFService.setTarget(defaultTarget).then(function (result) {
//								deferred.resolve(result);					
//							}, function(error) {
//								deferred.reject(error);					
//							});
//						} else {
//							var error = {};
//							var cloudSettingsPageUrl = new URITemplate("{+OrionHome}/settings/settings.html#,category=Cloud").expand({OrionHome : PageLinks.getOrionHome()});
//							error.Message = "Set up your Cloud. Go to [Settings](" + cloudSettingsPageUrl + ")."; 
//							error.Severity = "Warning";
//							deferred.reject(error);
//						}
//					} else {
//						// if cf target doesn't match settings, change settings
//						if (cFValid && cFTarget !== cfgTarget) {
//							props["app.target"] = cFTarget;
//							config.update(props);
//						}
//						deferred.resolve({target:cFTarget});
//					}
//				}, function (error) {
//					var cloudSettingsPageUrl = new URITemplate("{+OrionHome}/settings/settings.html#,category=Cloud").expand({OrionHome : PageLinks.getOrionHome()});
//					error.Message = "Set up your Cloud. Go to [Settings](" + cloudSettingsPageUrl + ")."; 
//					error.Severity = "Warning";
//					deferred.reject(error);
//				});	
//			}
//		);
//
//		return deferred;
	}

	function postMsg(status) {
		window.parent.postMessage(JSON.stringify({pageService: "orion.page.delegatedUI", 
			 source: "org.eclipse.orion.client.cf.deploy.uritemplate", 
			 status: status}), "*");
	}
	
	function postError(error) {
		if (error.HttpCode === 404){
			error = {
				State: "NOT_DEPLOYED",
				Message: error.Message
			};
		} else if (error.JsonData && error.JsonData.error_code) {
			var err = error.JsonData;
			if (err.error_code === "CF-InvalidAuthToken"){
				error.Retry = {
					parameters: [{id: "user", type: "text", name: "User:"}, {id: "password", type: "password", name: "Password:"}]
				};
			} else if (err.error_code === "CF-TargetNotSet"){
				var cloudSettingsPageUrl = new URITemplate("{+OrionHome}/settings/settings.html#,category=Cloud").expand({OrionHome : PageLinks.getOrionHome()});
				error.Message = "Set up your Cloud. Go to [Settings](" + cloudSettingsPageUrl + ")."; 
			}
		}
		
		window.parent.postMessage(JSON.stringify({pageService: "orion.page.delegatedUI", 
			 source: "org.eclipse.orion.client.cf.deploy.uritemplate", 
			 status: error}), "*");
	}
	
	function SpacesRenderer (options) {
		this._init(options);
	}
	SpacesRenderer.prototype = new mExplorer.SelectionRenderer(); 
	SpacesRenderer.prototype.constructor = SpacesRenderer;
	SpacesRenderer.prototype.getLabelColumnIndex = function() {
		return 0;
	};
	SpacesRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		if(col_no===0){
			var col = document.createElement("td"); //$NON-NLS-0$
			var span = document.createElement("span"); //$NON-NLS-0$
			span.id = tableRow.id+"navSpan"; //$NON-NLS-0$
			col.appendChild(span);
			span.className = "mainNavColumn singleNavColumn"; //$NON-NLS-0$
			span.appendChild(document.createTextNode(item.Space + " (" + item.Org + ")"));
			return col;
		}
	};

});