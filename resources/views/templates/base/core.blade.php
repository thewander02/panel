@extends('templates/wrapper', [
    'css' => ['body' => 'pyro-body bg-black h-full w-full'],
])

@section('container')
    <div data-pyro-modal-root id="modal-portal"></div>
    <div data-pyro-root class='pyro-app' id="app"></div>
@endsection
