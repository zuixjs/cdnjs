/* Tabulator v4.0.3 (c) Oliver Folkerd */

//public group object
var GroupComponent = function GroupComponent(group) {
	this._group = group;
	this.type = "GroupComponent";
};

GroupComponent.prototype.getKey = function () {
	return this._group.key;
};

GroupComponent.prototype.getElement = function () {
	return this._group.element;
};

GroupComponent.prototype.getRows = function () {
	var output = [];

	this._group.rows.forEach(function (row) {
		output.push(row.getComponent());
	});

	return output;
};

GroupComponent.prototype.getSubGroups = function () {
	var output = [];

	this._group.groupList.forEach(function (child) {
		output.push(child.getComponent());
	});

	return output;
};

GroupComponent.prototype.getParentGroup = function () {
	return this._group.parent ? this._group.parent.getComponent() : false;
};

GroupComponent.prototype.getVisibility = function () {
	return this._group.visible;
};

GroupComponent.prototype.show = function () {
	this._group.show();
};

GroupComponent.prototype.hide = function () {
	this._group.hide();
};

GroupComponent.prototype.toggle = function () {
	this._group.toggleVisibility();
};

GroupComponent.prototype._getSelf = function () {
	return this._group;
};

GroupComponent.prototype.getTable = function () {
	return this._group.table;
};

//////////////////////////////////////////////////
//////////////// Group Functions /////////////////
//////////////////////////////////////////////////

var Group = function Group(groupManager, parent, level, key, field, generator, oldGroup) {

	this.groupManager = groupManager;
	this.parent = parent;
	this.key = key;
	this.level = level;
	this.field = field;
	this.hasSubGroups = level < groupManager.groupIDLookups.length - 1;
	this.addRow = this.hasSubGroups ? this._addRowToGroup : this._addRow;
	this.type = "group"; //type of element
	this.old = oldGroup;
	this.rows = [];
	this.groups = [];
	this.groupList = [];
	this.generator = generator;
	this.elementContents = false;
	this.height = 0;
	this.outerHeight = 0;
	this.initialized = false;
	this.calcs = {};
	this.initialized = false;
	this.modules = {};

	this.visible = oldGroup ? oldGroup.visible : typeof groupManager.startOpen[level] !== "undefined" ? groupManager.startOpen[level] : groupManager.startOpen[0];

	this.createElements();
	this.addBindings();
};

Group.prototype.createElements = function () {
	this.element = document.createElement("div");
	this.element.classList.add("tabulator-row");
	this.element.classList.add("tabulator-group");
	this.element.classList.add("tabulator-group-level-" + this.level);
	this.element.setAttribute("role", "rowgroup");

	this.arrowElement = document.createElement("div");
	this.arrowElement.classList.add("tabulator-arrow");
};

Group.prototype.addBindings = function () {
	var self = this,
	    dblTap,
	    tapHold,
	    tap,
	    toggleElement;

	//handle group click events
	if (self.groupManager.table.options.groupClick) {
		self.element.addEventListener("click", function (e) {
			self.groupManager.table.options.groupClick(e, self.getComponent());
		});
	}

	if (self.groupManager.table.options.groupDblClick) {
		self.element.addEventListener("dblclick", function (e) {
			self.groupManager.table.options.groupDblClick(e, self.getComponent());
		});
	}

	if (self.groupManager.table.options.groupContext) {
		self.element.addEventListener("contextmenu", function (e) {
			self.groupManager.table.options.groupContext(e, self.getComponent());
		});
	}

	if (self.groupManager.table.options.groupTap) {

		tap = false;

		self.element.addEventListener("touchstart", function (e) {
			tap = true;
		});

		self.element.addEventListener("touchend", function (e) {
			if (tap) {
				self.groupManager.table.options.groupTap(e, self.getComponent());
			}

			tap = false;
		});
	}

	if (self.groupManager.table.options.groupDblTap) {

		dblTap = null;

		self.element.addEventListener("touchend", function (e) {

			if (dblTap) {
				clearTimeout(dblTap);
				dblTap = null;

				self.groupManager.table.options.groupDblTap(e, self.getComponent());
			} else {

				dblTap = setTimeout(function () {
					clearTimeout(dblTap);
					dblTap = null;
				}, 300);
			}
		});
	}

	if (self.groupManager.table.options.groupTapHold) {

		tapHold = null;

		self.element.addEventListener("touchstart", function (e) {
			clearTimeout(tapHold);

			tapHold = setTimeout(function () {
				clearTimeout(tapHold);
				tapHold = null;
				tap = false;
				self.groupManager.table.options.groupTapHold(e, self.getComponent());
			}, 1000);
		});

		self.element.addEventListener("touchend", function (e) {
			clearTimeout(tapHold);
			tapHold = null;
		});
	}

	if (self.groupManager.table.options.groupToggleElement) {
		toggleElement = self.groupManager.table.options.groupToggleElement == "arrow" ? self.arrowElement : self.element;

		toggleElement.addEventListener("click", function (e) {
			e.stopPropagation();
			e.stopImmediatePropagation();
			self.toggleVisibility();
		});
	}
};

Group.prototype._addRowToGroup = function (row) {

	var level = this.level + 1;

	if (this.hasSubGroups) {
		var groupID = this.groupManager.groupIDLookups[level].func(row.getData());

		if (!this.groups[groupID]) {
			var group = new Group(this.groupManager, this, level, groupID, this.groupManager.groupIDLookups[level].field, this.groupManager.headerGenerator[level] || this.groupManager.headerGenerator[0], this.old ? this.old.groups[groupID] : false);

			this.groups[groupID] = group;
			this.groupList.push(group);
		}

		this.groups[groupID].addRow(row);
	}
};

Group.prototype._addRow = function (row) {
	this.rows.push(row);
	row.modules.group = this;
};

Group.prototype.insertRow = function (row, to, after) {
	var data = this.conformRowData({});

	row.updateData(data);

	var toIndex = this.rows.indexOf(to);

	if (toIndex > -1) {
		if (after) {
			this.rows.splice(toIndex + 1, 0, row);
		} else {
			this.rows.splice(toIndex, 0, row);
		}
	} else {
		if (after) {
			this.rows.push(row);
		} else {
			this.rows.unshift(row);
		}
	}

	row.modules.group = this;

	this.generateGroupHeaderContents();

	if (this.groupManager.table.modExists("columnCalcs") && this.groupManager.table.options.columnCalcs != "table") {
		this.groupManager.table.modules.columnCalcs.recalcGroup(this);
	}
};

Group.prototype.getRowIndex = function (row) {};

//update row data to match grouping contraints
Group.prototype.conformRowData = function (data) {
	if (this.field) {
		data[this.field] = this.key;
	} else {
		console.warn("Data Conforming Error - Cannot conform row data to match new group as groupBy is a function");
	}

	if (this.parent) {
		data = this.parent.conformRowData(data);
	}

	return data;
};

Group.prototype.removeRow = function (row) {
	var index = this.rows.indexOf(row);

	if (index > -1) {
		this.rows.splice(index, 1);
	}

	if (!this.rows.length) {
		if (this.parent) {
			this.parent.removeGroup(this);
		} else {
			this.groupManager.removeGroup(this);
		}

		this.groupManager.updateGroupRows(true);
	} else {
		this.generateGroupHeaderContents();
		if (this.groupManager.table.modExists("columnCalcs") && this.groupManager.table.options.columnCalcs != "table") {
			this.groupManager.table.modules.columnCalcs.recalcGroup(this);
		}
	}
};

Group.prototype.removeGroup = function (group) {
	var index;

	if (this.groups[group.key]) {
		delete this.groups[group.key];

		index = this.groupList.indexOf(group);

		if (index > -1) {
			this.groupList.splice(index, 1);
		}

		if (!this.groupList.length) {
			if (this.parent) {
				this.parent.removeGroup(this);
			} else {
				this.groupManager.removeGroup(this);
			}
		}
	}
};

Group.prototype.getHeadersAndRows = function () {
	var output = [];

	output.push(this);

	this._visSet();

	if (this.visible) {

		if (this.groupList.length) {
			this.groupList.forEach(function (group) {
				output = output.concat(group.getHeadersAndRows());
			});
		} else {
			if (this.groupManager.table.options.columnCalcs != "table" && this.groupManager.table.modExists("columnCalcs") && this.groupManager.table.modules.columnCalcs.hasTopCalcs()) {
				this.calcs.top = this.groupManager.table.modules.columnCalcs.generateTopRow(this.rows);
				output.push(this.calcs.top);
			}

			output = output.concat(this.rows);

			if (this.groupManager.table.options.columnCalcs != "table" && this.groupManager.table.modExists("columnCalcs") && this.groupManager.table.modules.columnCalcs.hasBottomCalcs()) {
				this.calcs.bottom = this.groupManager.table.modules.columnCalcs.generateBottomRow(this.rows);
				output.push(this.calcs.bottom);
			}
		}
	} else {
		if (!this.groupList.length && this.groupManager.table.options.columnCalcs != "table" && this.groupManager.table.options.groupClosedShowCalcs) {
			if (this.groupManager.table.modExists("columnCalcs")) {
				if (this.groupManager.table.modules.columnCalcs.hasTopCalcs()) {
					this.calcs.top = this.groupManager.table.modules.columnCalcs.generateTopRow(this.rows);
					output.push(this.calcs.top);
				}

				if (this.groupManager.table.modules.columnCalcs.hasBottomCalcs()) {
					this.calcs.bottom = this.groupManager.table.modules.columnCalcs.generateBottomRow(this.rows);
					output.push(this.calcs.bottom);
				}
			}
		}
	}

	return output;
};

Group.prototype.getRows = function () {
	this._visSet();

	return this.visible ? this.rows : [];
};

Group.prototype.getRowCount = function () {
	var count = 0;

	if (this.groupList.length) {
		this.groupList.forEach(function (group) {
			count += group.getRowCount();
		});
	} else {
		count = this.rows.length;
	}
	return count;
};

Group.prototype.toggleVisibility = function () {
	if (this.visible) {
		this.hide();
	} else {
		this.show();
	}
};

Group.prototype.hide = function () {
	this.visible = false;

	if (this.groupManager.table.rowManager.getRenderMode() == "classic" && !this.groupManager.table.options.pagination) {

		this.element.classList.remove("tabulator-group-visible");

		if (this.groupList.length) {
			this.groupList.forEach(function (group) {

				var el;

				if (group.calcs.top) {
					el = group.calcs.top.getElement();
					el.parentNode.removeChild(el);
				}

				if (group.calcs.bottom) {
					el = group.calcs.bottom.getElement();
					el.parentNode.removeChild(el);
				}

				var rows = group.getHeadersAndRows();

				rows.forEach(function (row) {
					var rowEl = row.getElement();
					rowEl.parentNode.removeChild(rowEl);
				});
			});
		} else {
			this.rows.forEach(function (row) {
				var rowEl = row.getElement();
				rowEl.parentNode.removeChild(rowEl);
			});
		}

		this.groupManager.table.rowManager.setDisplayRows(this.groupManager.updateGroupRows(), this.groupManager.getDisplayIndex());
	} else {
		this.groupManager.updateGroupRows(true);
	}

	this.groupManager.table.options.groupVisibilityChanged.call(this.table, this.getComponent(), false);
};

Group.prototype.show = function () {
	var self = this;

	self.visible = true;

	if (this.groupManager.table.rowManager.getRenderMode() == "classic" && !this.groupManager.table.options.pagination) {

		this.element.classList.add("tabulator-group-visible");

		var prev = self.getElement();

		if (this.groupList.length) {
			this.groupList.forEach(function (group) {
				var rows = group.getHeadersAndRows();

				rows.forEach(function (row) {
					var rowEl = row.getElement();
					prev.parentNode.insertBefore(rowEl, prev.nextSibling);
					row.initialize();
					prev = rowEl;
				});
			});
		} else {
			self.rows.forEach(function (row) {
				var rowEl = row.getElement();
				prev.parentNode.insertBefore(rowEl, prev.nextSibling);
				row.initialize();
				prev = rowEl;
			});
		}

		this.groupManager.table.rowManager.setDisplayRows(this.groupManager.updateGroupRows(), this.groupManager.getDisplayIndex());
	} else {
		this.groupManager.updateGroupRows(true);
	}

	this.groupManager.table.options.groupVisibilityChanged.call(this.table, this.getComponent(), true);
};

Group.prototype._visSet = function () {
	var data = [];

	if (typeof this.visible == "function") {

		this.rows.forEach(function (row) {
			data.push(row.getData());
		});

		this.visible = this.visible(this.key, this.getRowCount(), data, this.getComponent());
	}
};

Group.prototype.getRowGroup = function (row) {
	var match = false;
	if (this.groupList.length) {
		this.groupList.forEach(function (group) {
			var result = group.getRowGroup(row);

			if (result) {
				match = result;
			}
		});
	} else {
		if (this.rows.find(function (item) {
			return item === row;
		})) {
			match = this;
		}
	}

	return match;
};

Group.prototype.generateGroupHeaderContents = function () {
	var data = [];

	this.rows.forEach(function (row) {
		data.push(row.getData());
	});

	this.elementContents = this.generator(this.key, this.getRowCount(), data, this.getComponent());

	while (this.element.firstChild) {
		this.element.removeChild(this.element.firstChild);
	}if (typeof this.elementContents === "string") {
		this.element.innerHTML = this.elementContents;
	} else {
		this.element.appendChild(this.elementContents);
	}

	this.element.insertBefore(this.arrowElement, this.element.firstChild);
};

////////////// Standard Row Functions //////////////

Group.prototype.getElement = function () {
	this.addBindingsd = false;

	this._visSet();

	if (this.visible) {
		this.element.classList.add("tabulator-group-visible");
	} else {
		this.element.classList.remove("tabulator-group-visible");
	}

	this.element.childNodes.forEach(function (child) {
		child.parentNode.removeChild(child);
	});

	this.generateGroupHeaderContents();

	// this.addBindings();

	return this.element;
};

//normalize the height of elements in the row
Group.prototype.normalizeHeight = function () {
	this.setHeight(this.element.clientHeight);
};

Group.prototype.initialize = function (force) {
	if (!this.initialized || force) {
		this.normalizeHeight();
		this.initialized = true;
	}
};

Group.prototype.reinitialize = function () {
	this.initialized = false;
	this.height = 0;

	if (Tabulator.prototype.helpers.elVisible(this.element)) {
		this.initialize(true);
	}
};

Group.prototype.setHeight = function (height) {
	if (this.height != height) {
		this.height = height;
		this.outerHeight = this.element.offsetHeight;
	}
};

//return rows outer height
Group.prototype.getHeight = function () {
	return this.outerHeight;
};

Group.prototype.getGroup = function () {
	return this;
};

Group.prototype.reinitializeHeight = function () {};
Group.prototype.calcHeight = function () {};
Group.prototype.setCellHeight = function () {};
Group.prototype.clearCellHeight = function () {};

//////////////// Object Generation /////////////////
Group.prototype.getComponent = function () {
	return new GroupComponent(this);
};

//////////////////////////////////////////////////
////////////// Group Row Extension ///////////////
//////////////////////////////////////////////////

var GroupRows = function GroupRows(table) {

	this.table = table; //hold Tabulator object

	this.groupIDLookups = false; //enable table grouping and set field to group by
	this.startOpen = [function () {
		return false;
	}]; //starting state of group
	this.headerGenerator = [function () {
		return "";
	}];
	this.groupList = []; //ordered list of groups
	this.groups = {}; //hold row groups
	this.displayIndex = 0; //index in display pipeline
};

//initialize group configuration
GroupRows.prototype.initialize = function () {
	var self = this,
	    groupBy = self.table.options.groupBy,
	    startOpen = self.table.options.groupStartOpen,
	    groupHeader = self.table.options.groupHeader;

	self.headerGenerator = [function () {
		return "";
	}];
	this.startOpen = [function () {
		return false;
	}]; //starting state of group

	self.table.modules.localize.bind("groups|item", function (langValue, lang) {
		self.headerGenerator[0] = function (value, count, data) {
			//header layout function
			return (typeof value === "undefined" ? "" : value) + "<span>(" + count + " " + (count === 1 ? langValue : lang.groups.items) + ")</span>";
		};
	});

	this.groupIDLookups = [];

	if (Array.isArray(groupBy) || groupBy) {
		if (this.table.modExists("columnCalcs") && this.table.options.columnCalcs != "table" && this.table.options.columnCalcs != "both") {
			this.table.modules.columnCalcs.removeCalcs();
		}
	} else {
		if (this.table.modExists("columnCalcs") && this.table.options.columnCalcs != "group") {

			var cols = this.table.columnManager.getRealColumns();

			cols.forEach(function (col) {
				if (col.definition.topCalc) {
					self.table.modules.columnCalcs.initializeTopRow();
				}

				if (col.definition.bottomCalc) {
					self.table.modules.columnCalcs.initializeBottomRow();
				}
			});
		}
	}

	if (!Array.isArray(groupBy)) {
		groupBy = [groupBy];
	}

	groupBy.forEach(function (group) {
		var lookupFunc, column;

		if (typeof group == "function") {
			lookupFunc = group;
		} else {
			column = self.table.columnManager.getColumnByField(group);

			if (column) {
				lookupFunc = function lookupFunc(data) {
					return column.getFieldValue(data);
				};
			} else {
				lookupFunc = function lookupFunc(data) {
					return data[group];
				};
			}
		}

		self.groupIDLookups.push({
			field: typeof group === "function" ? false : group,
			func: lookupFunc
		});
	});

	if (startOpen) {

		if (!Array.isArray(startOpen)) {
			startOpen = [startOpen];
		}

		startOpen.forEach(function (level) {
			level = typeof level == "function" ? level : function () {
				return true;
			};
		});

		self.startOpen = startOpen;
	}

	if (groupHeader) {
		self.headerGenerator = Array.isArray(groupHeader) ? groupHeader : [groupHeader];
	}

	this.initialized = true;
};

GroupRows.prototype.setDisplayIndex = function (index) {
	this.displayIndex = index;
};

GroupRows.prototype.getDisplayIndex = function () {
	return this.displayIndex;
};

//return appropriate rows with group headers
GroupRows.prototype.getRows = function (rows) {
	if (this.groupIDLookups.length) {

		this.table.options.dataGrouping.call(this.table);

		this.generateGroups(rows);

		if (this.table.options.dataGrouped) {
			this.table.options.dataGrouped.call(this.table, this.getGroups());
		}

		return this.updateGroupRows();
	} else {
		return rows.slice(0);
	}
};

GroupRows.prototype.getGroups = function () {
	var groupComponents = [];

	this.groupList.forEach(function (group) {
		groupComponents.push(group.getComponent());
	});

	return groupComponents;
};

GroupRows.prototype.getRowGroup = function (row) {
	var match = false;

	this.groupList.forEach(function (group) {
		var result = group.getRowGroup(row);

		if (result) {
			match = result;
		}
	});

	return match;
};

GroupRows.prototype.countGroups = function () {
	return this.groupList.length;
};

GroupRows.prototype.generateGroups = function (rows) {
	var self = this,
	    oldGroups = self.groups;

	self.groups = {};
	self.groupList = [];

	rows.forEach(function (row) {
		self.assignRowToGroup(row, oldGroups);
	});
};

GroupRows.prototype.assignRowToGroup = function (row, oldGroups) {
	var groupID = this.groupIDLookups[0].func(row.getData()),
	    newGroupNeeded = !this.groups[groupID];

	oldGroups = oldGroups || [];

	if (newGroupNeeded) {
		var group = new Group(this, false, 0, groupID, this.groupIDLookups[0].field, this.headerGenerator[0], oldGroups[groupID]);

		this.groups[groupID] = group;
		this.groupList.push(group);
	}

	this.groups[groupID].addRow(row);

	return !newGroupNeeded;
};

GroupRows.prototype.updateGroupRows = function (force) {
	var self = this,
	    output = [],
	    oldRowCount;

	self.groupList.forEach(function (group) {
		output = output.concat(group.getHeadersAndRows());
	});

	//force update of table display
	if (force) {

		var displayIndex = self.table.rowManager.setDisplayRows(output, this.getDisplayIndex());

		if (displayIndex !== true) {
			this.setDisplayIndex(displayIndex);
		}

		self.table.rowManager.refreshActiveData("group", true, true);
	}

	return output;
};

GroupRows.prototype.scrollHeaders = function (left) {
	this.groupList.forEach(function (group) {
		group.arrowElement.style.marginLeft = left + "px";
	});
};

GroupRows.prototype.removeGroup = function (group) {
	var index;

	if (this.groups[group.key]) {
		delete this.groups[group.key];

		index = this.groupList.indexOf(group);

		if (index > -1) {
			this.groupList.splice(index, 1);
		}
	}
};

Tabulator.prototype.registerModule("groupRows", GroupRows);