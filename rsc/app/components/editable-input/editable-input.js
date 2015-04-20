App.InputView = Ember.View.extend({
	tagName: 'input',
	classNames: ['edit'],
	value: null,
	width: null,
	submitted: false,
	empty: null,
	didInsertElement: function() {
		this._super();
		this.$().css('width', this.width).prop('value', this.value).focus();
	},
	focusOut: function() {
		this.submit();
	},
	keyPress: function(ev) {
		if (ev.charCode == 13) {
			this.submit();
		}
	},
	submit: function() {
		var value = this.$().prop('value');
		this.set('value', value == '' ? this.empty : value);
		// hack in case value did not changed...
		this.set('submitted', true);
	},
});

App.EditableInputView = Ember.View.extend({
	tagName: 'span',
	edited: null,
	editing: false,
	empty: null,
	readOnly: false,
	submitted: false,
	value: null,
	width: null,
	templateName: 'editable-input',
	editingTimeout: null,
	onEdited: function() {
		if (this.get('editing')) {
			// edited change when the input changed.
			// Let's kill the input and go back just
			// displaying the value.
			this.set('editing', false);
			this.set('value', this.get('edited'));
			this.set('submitted', false);
		};
	}.observes('edited', 'submitted'),
	doubleClick: function(ev) {
		this.startEditing();
	},
	touchStart: function(ev) {
		var self = this;
		this.editingTimeout = window.setTimeout(function() {
			self.editingTimeout = null;
			self.startEditing();
		}, 1000);
	},
	touchEnd: function(ev) {
		if (this.editingTimeout) {
			window.clearTimeout(this.editingTimeout);
			this.editingTimeout = null;
		}
	},
	touchMove: function(ev) {
		if (this.editingTimeout) {
			window.clearTimeout(this.editingTimeout);
			this.editingTimeout = null;
		}
	},
	startEditing: function() {
		if (this.get('readOnly')) { return; }
		if (!this.get('editing')) {
			this.set('width', this.$().width());
			this.set('edited', this.get('value'));
			this.set('editing', true);
		}
	},
});

Ember.Handlebars.helper('std-input', App.InputView);
Ember.Handlebars.helper('editable-input', App.EditableInputView);
