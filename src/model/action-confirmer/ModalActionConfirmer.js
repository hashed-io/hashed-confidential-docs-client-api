const BaseActionConfirmer = require('./BaseActionConfirmer')

const modalHtml = `
<div class="mac-modal" style="display: none;position: fixed;z-index: 1;left: 0;top: 0;width: 100%;height: 100%;overflow: auto;background-color: rgb(0,0,0);background-color: rgba(0,0,0,0.4);">
  <div class="mac-modal-body" style="background-color: #fefefe;margin: 15% auto;padding: 20px;border: 1px solid #888;width: 80%;">
    <div class="mac-modal-header">
      <h2>Confirm Action</h2>
    </div>  
    <div class="mac-modal-content">
      <p>Some text in the Modal..</p>
    </div>
    <div class="mac-modal-footer">
      <button class="mac-modal-cancel-btn" type="button">Cancel</button>
      <button class="mac-modal-confirm-btn" type="button">Confirm</button>
    </div>
  </div>
</div>
`

class ModalActionConfirmer extends BaseActionConfirmer {
  constructor () {
    super()
    this._modal = null
    this._content = null
    this._cancelBtn = null
    this._confirmBtn = null
  }

  confirm (details, onConfirm, onCancel) {
    this._showModal('', onConfirm, onCancel)
  }

  _showModal (content, onConfirm, onCancel) {
    const d = window.document
    if (!this._modal) {
      const elements = d.getElementsByClassName('mac-modal')
      if (!elements.length) {
        d.body.insertAdjacentHTML('beforeend', modalHtml)
      }
      this._modal = elements[0]
      this._content = this._modal.getElementsByClassName('mac-modal-content')
      this._cancelBtn = this._modal.getElementsByClassName('mac-modal-cancel-btn')
      this._confirmBtn = this._modal.getElementsByClassName('mac-modal-confirm-btn')
    }
    this._cancelBtn.onclick = () => {
      this._hide()
      onCancel('User cancelled action')
    }
    this._confirmBtn.onclick = () => {
      this._hide()
      onConfirm()
    }
    this._display()
  }

  _hide () {
    this._modal.style.display = 'none'
  }

  _display () {
    this._modal.style.display = 'block'
  }
}

module.exports = ModalActionConfirmer
