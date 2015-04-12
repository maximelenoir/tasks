App.AreaView = Ember.View.extend({
	tagName: 'textarea',
	classNames: ['edit'], // Defined in components/editable-input/editable-input.css
	value: null,
	width: null,
	height: null,
	submitted: false,
	empty: null,
	didInsertElement: function() {
		this._super();
		this.$().css('width', this.width).css('height', this.height)
		.prop('value', this.get('value')).focus();
		autosize(this.$());
	},
	focusOut: function() {
		this.submit();
	},
	keyPress: function(ev) {
		if ((ev.charCode == 13 || ev.key == "Enter") && !ev.shiftKey) {
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

// TODO: derive from EditableInputView or
// create a common parent class.
App.EditableAreaView = Ember.View.extend({
	tagName: 'div',
	edited: null,
	editing: false,
	empty: null,
	links: null,
	readOnly: false,
	submitted: false,
	value: null,
	width: null,
	height: null,
	templateName: 'editable-area',
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
	startEditing: function() {
		if (this.get('readOnly')) { return; }
		if (!this.get('editing')) {
			this.set('width', this.$().parent().width());
			this.set('height', this.$().parent().height());
			this.set('edited', this.get('value'));
			this.set('editing', true);
		}
	},
});

Ember.Handlebars.helper('std-area', App.AreaView);
Ember.Handlebars.helper('editable-area', App.EditableAreaView);
