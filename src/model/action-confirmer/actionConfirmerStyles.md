**Custom styles for confirmer modal**

You can custom the styles for confirmer modal overwriting the following classes

*Classes names*
 - hcd-modal
 - hcd-modal-body
 - hcd-modal-header
 - hcd-modal-title-header
 - hcd-modal-content
 - hcd-modal-footer
 - hcd-modal-btn
 - hcd-modal-cancel-btn
 - hcd-modal-confirm-btn
 - hcd-label-name
 - hcd-label-value
 - hcd-content-params-container
 - hcd-content-params-viewer

*Main html structure*

```
div class="hcd-modal" id="hcdModalContainer">
  <div class="hcd-modal-body" id="hcdModalBody""">
    <div class="hcd-modal-header">
      <h2 class="hcd-modal-title-header">Title</h2>
    </div>
    <div id="hcdModalContent" class="hcd-modal-content">
    </div>
    <div class="hcd-modal-footer">
      <button class="hcd-modal-btn hcd-modal-cancel-btn" type="button">Cancel</button>
      <button class="hcd-modal-btn hcd-modal-confirm-btn" type="button">Confirm</button>
    </div>
  </div>
</div>
```